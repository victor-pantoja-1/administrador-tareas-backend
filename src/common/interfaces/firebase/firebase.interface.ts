import { NotificationTypes } from 'src/common/enums/notifications.enum';
import { TaskStatusEnum } from 'src/common/enums/task-status.enum';

export type MetadataType<T extends NotificationTypes> = T extends NotificationTypes.TASK_ASSIGNATIONS
  ? ITaskAssignationMetadata
  : T extends NotificationTypes.TASK_CHANGE_STATUS
  ? ITaskChangeStatusMetadata
  : T extends NotificationTypes.TASK_REQUEST_APPOVED
  ? ITaskRequestApprovedMetadata
  : T extends NotificationTypes.TASK_NEW_MESSAGE
  ? ITaskNewMessageMetadata
  : any;

export interface ITaskAssignationMetadata {
  name: string;
  taskId: string
}

export interface ITaskRequestApprovedMetadata {
  name: string;
  taskId: string
}

export interface ITaskRequestMetadata {
  name: string;
  requestTaskId: string
}

export interface ITaskRatingMetadata {
  name: string;
  taskId: string;
  score: number;
}

export interface ITaskChangeStatusMetadata {
  name: string;
  status: TaskStatusEnum;
  taskId: string
}

export interface ITaskNewMessageMetadata {
  sender: string;
  message: string;
  conversationId: string;
  taskId: string
}

export interface TriggerDataNotification {
  type: NotificationTypes;
  taskId?: string;
  conversationId?: string;
  requestTaskId?: string;
}

export interface IPushNotification {
  notification: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: TriggerDataNotification;
}

export interface IConfigMessageSend extends IPushNotification {
  tokens: string[];
}

export interface ISentPushNotification {
  token: string;
  notificationId: string;
}
