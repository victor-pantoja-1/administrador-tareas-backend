import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLogEntity } from './entities/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { IPaginationResponse } from 'src/common/interfaces/common/base-response';
import { ResponseFormatter } from 'src/common/helpers/response-formatter.service';
import { HttpMessages } from 'src/common/enums/http-messages.enum';
import { FilterPaginationAuditLog } from './dto/filter-pagination-audit-log.dto';
import { compareDateRange } from 'src/common/helpers/dates';

@Injectable()
export class AuditLogService extends ResponseFormatter {
  constructor(
    @InjectRepository(AuditLogEntity) private auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async create(entry: CreateAuditLogDto): Promise<AuditLogEntity> {
    const log = this.auditLogRepository.create(entry);

    return this.auditLogRepository.save(log);
  }

  async findAllPaginated(paramPaginate: FilterPaginationAuditLog): Promise<IPaginationResponse<AuditLogEntity>> {
		const { search, action, endDate, entities, limit, page, startDate, users } = paramPaginate;

		compareDateRange(startDate, endDate);

    const queryBuilder = this.auditLogRepository
			.createQueryBuilder('logs')
			.leftJoinAndSelect('logs.user', 'users')

			if (entities && entities.length > 0) {
				queryBuilder.andWhere('logs.entity IN (:...entities)', { entities });
			}

			if (users && users.length > 0) {
				queryBuilder.andWhere('logs.user.id IN (:...users)', { users });
			}
	
			if (action) {
				queryBuilder.andWhere('logs.action = :action', { action });
			}
	
			if (startDate) {
				queryBuilder.andWhere('logs.createdAt >= :startDate', { startDate });
			}
	
			if (endDate) {
				queryBuilder.andWhere('logs.createdAt <= :endDate', { endDate });
			}

			queryBuilder.select([
				'logs.id',
				'logs.entity',
				'logs.documentId',
				'logs.action',
				'logs.ipAddress',
				'logs.createdAt',
				'users.id',
				'users.name',
				'users.lastName',
			]);

			queryBuilder.orderBy('logs.createdAt', 'DESC')

		const logs = await this.paginate<AuditLogEntity>(
			queryBuilder,
			{ search, limit, page },
			HttpStatus.OK,
			HttpMessages.AUDIT_LOGS_RETRIEVED_SUCCESSFULLY,
		);

		if (!logs) {
			throw new HttpException(
				HttpMessages.AUDIT_LOGS_NOT_FOUND,
				HttpStatus.NOT_FOUND,
			);
		}

		return logs;
  }

  async findOne(id: string) {
    try {
			const query = this.auditLogRepository
      	.createQueryBuilder('log')
				.leftJoin('log.user', 'user')
  			.select(['log', 'user.id', 'user.name', 'user.lastName', 'user.email'])
				.where('log.id = :id', { id })

			const log = await query.getOne();

			if (!log) {
				throw new HttpException(
					HttpMessages.AUDIT_LOGS_NOT_FOUND,
					HttpStatus.NOT_FOUND,
				);
			}

			return this.standartResponse<AuditLogEntity>(
				log,
				HttpStatus.OK,
				HttpMessages.AUDIT_LOGS_RETRIEVED_SUCCESSFULLY,
			);
		} catch (error) {
			throw new HttpException(
				error.message || HttpMessages.INTERNAL_SERVER_ERROR,
				error.status || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
  }

  update(id: number, updateAuditLogDto: UpdateAuditLogDto) {
    return `This action updates a #${id} auditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditLog`;
  }
}
