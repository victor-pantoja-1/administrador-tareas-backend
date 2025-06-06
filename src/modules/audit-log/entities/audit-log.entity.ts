import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { AuditLogsActionsEnum } from 'src/common/enums/audit-logs-actions.enum';

@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({
    nullable: false,
  })
  entity: string;

  @Column({
    nullable: true,
  })
  documentId: string;

  @Column({
    type: 'enum',
    enum: Object.values(AuditLogsActionsEnum),
    nullable: false,
  })
  action: string;

  @ManyToOne(() => UserEntity, user => user.auditLogs)
  user: UserEntity;

  @Column({
    nullable: false,
  })
  ipAddress: string;

  @Column('json', { nullable: true })
  beforeChanges: object;

  @Column('json', { nullable: true })
  snapshot: object;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
