import {
  Controller, Get, Post, Patch, Query, Param,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DeadlinesService } from './deadlines.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Deadlines')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'deadlines', version: '1' })
export class DeadlinesController {
  constructor(private readonly deadlinesService: DeadlinesService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary: overdue count, penalties, upcoming deadlines' })
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.deadlinesService.getDashboardSummary(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deadlines with optional filters' })
  @ApiQuery({ name: 'category', required: false, enum: ['GST','TDS','PF','ESI','MCA','INCOME_TAX','PROFESSIONAL_TAX','INDUSTRY'] })
  @ApiQuery({ name: 'status',   required: false, enum: ['PENDING','FILED','OVERDUE'] })
  @ApiQuery({ name: 'search',   required: false })
  getAll(
    @CurrentUser() user: { id: string },
    @Query('category') category?: string,
    @Query('status')   status?: string,
    @Query('search')   search?: string,
  ) {
    return this.deadlinesService.getAll(user.id, { category, status, search });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get deadlines grouped by day for a specific month' })
  @ApiQuery({ name: 'year',  required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  getCalendar(
    @CurrentUser() user: { id: string },
    @Query('year',  new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)  year: number,
    @Query('month', new DefaultValuePipe(new Date().getMonth() + 1), ParseIntPipe) month: number,
  ) {
    return this.deadlinesService.getCalendar(user.id, year, month);
  }

  @Patch(':id/file')
  @ApiOperation({ summary: 'Mark a deadline as filed' })
  markFiled(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.deadlinesService.markAsFiled(user.id, id);
  }
}
