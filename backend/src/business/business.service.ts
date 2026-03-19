import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto';
import { encryptField, decryptField, validateGstin } from '../common/utils/crypto.util';

@Injectable()
export class BusinessService {
  private readonly logger = new Logger(BusinessService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('deadline-generation') private deadlineQueue: Queue,
  ) {}

  async createOrUpdateProfile(userId: string, dto: CreateBusinessProfileDto) {
    if (dto.gstin && !validateGstin(dto.gstin)) {
      throw new BadRequestException('Invalid GSTIN format');
    }

    const gstinEncrypted = dto.gstin ? encryptField(dto.gstin) : undefined;

    const business = await this.prisma.business.upsert({
      where: { userId },
      create: {
        userId,
        name: dto.name,
        gstinEncrypted,
        entityType: dto.entityType,
        gstStatus: dto.gstStatus,
        employeeRange: dto.employeeRange,
        states: dto.states,
        industry: dto.industry,
        turnoverRange: dto.turnoverRange,
        isExporter: dto.isExporter ?? false,
        hasPoshObligation: dto.hasPoshObligation ?? false,
        profileComplete: true,
        subscription: { create: { plan: 'FREE', status: 'TRIAL' } },
      },
      update: {
        name: dto.name,
        gstinEncrypted,
        entityType: dto.entityType,
        gstStatus: dto.gstStatus,
        employeeRange: dto.employeeRange,
        states: dto.states,
        industry: dto.industry,
        turnoverRange: dto.turnoverRange,
        isExporter: dto.isExporter ?? false,
        hasPoshObligation: dto.hasPoshObligation ?? false,
        profileComplete: true,
      },
    });

    // Queue deadline generation
    await this.deadlineQueue.add(
      'generate-deadlines',
      { businessId: business.id },
      { priority: 1, attempts: 3 },
    );

    this.logger.log(`Business profile saved for user ${userId}, businessId ${business.id}`);
    return this.formatBusiness(business);
  }

  async getProfile(userId: string) {
    const business = await this.prisma.business.findUnique({
      where: { userId },
      include: { subscription: true, ca: { include: { user: true } } },
    });
    if (!business) throw new NotFoundException('Business profile not found');
    return this.formatBusiness(business);
  }

  async updateProfile(userId: string, dto: UpdateBusinessProfileDto) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException('Business profile not found');

    if (dto.gstin && !validateGstin(dto.gstin)) {
      throw new BadRequestException('Invalid GSTIN format');
    }

    const updated = await this.prisma.business.update({
      where: { userId },
      data: {
        ...dto,
        gstinEncrypted: dto.gstin ? encryptField(dto.gstin) : undefined,
      },
    });

    // Re-generate deadlines if profile changed
    await this.deadlineQueue.add(
      'regenerate-deadlines',
      { businessId: business.id },
      { priority: 2 },
    );

    return this.formatBusiness(updated);
  }

  async getNotificationPreferences(userId: string) {
    const business = await this.prisma.business.findUnique({ where: { userId } });
    if (!business) throw new NotFoundException();
    return {
      whatsapp: true,
      smsFallback: false,
      emailDigest: false,
      reminderDays: [7, 3, 0],
      reminderTime: '08:00',
    };
  }

  async updateNotificationPreferences(userId: string, prefs: any) {
    // In production: store in a BusinessPreferences table
    return { ...prefs, updatedAt: new Date() };
  }

  private formatBusiness(business: any) {
    const { gstinEncrypted, ...rest } = business;
    return {
      ...rest,
      gstin: gstinEncrypted ? decryptField(gstinEncrypted) : null,
    };
  }
}
