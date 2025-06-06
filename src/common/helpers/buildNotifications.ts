import { TRANSLATE_EMAIL } from '../constants/email.constants';
import { TRANSLATE_NOTIFICATION } from '../constants/notifications.constants';
import { NotificationTypes } from '../enums/notifications.enum';
import {
  IPushNotification,
  ITaskAssignationMetadata,
  ITaskChangeStatusMetadata,
  ITaskNewMessageMetadata,
  ITaskRatingMetadata,
  ITaskRequestApprovedMetadata,
  ITaskRequestMetadata,
  MetadataType
} from '../interfaces/firebase/firebase.interface';

/**
 * Allows you to build a notification given the type and data provided
 * @param type Type of notification that will be sent
 * @param lang Language code that will be used to send the data
 * @param metadata Additional data that will be used in the mobile app to carry out actions
 * @returns Constructed notification object
 */
export function buildNotification<T extends NotificationTypes>(
  type: T,
  lang: keyof typeof TRANSLATE_NOTIFICATION,
  metadata: MetadataType<T>
): IPushNotification {

  switch (type) {
    case NotificationTypes.TASK_CHANGE_STATUS: {
      const { name, status, taskId } = metadata as ITaskChangeStatusMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].TASK_STATUS_UPDATED_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].TASK_STATUS_UPDATED_BODY, {
            name,
            status: TRANSLATE_EMAIL[lang][status],
          }),
        },
        data: { taskId, type },
      }
    }

    case NotificationTypes.TASK_ASSIGNATIONS: {
      const { name, taskId } = metadata as ITaskAssignationMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].TASK_ASSIGNATION_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].TASK_ASSIGNATION_BODY, {
            name,
          }),
        },
        data: { taskId, type },
      }
    }

    case NotificationTypes.TASK_REQUEST_APPOVED: {
      const { name, taskId } = metadata as ITaskRequestApprovedMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].TASK_APPROVED_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].TASK_APPROVED_BODY, {
            name,
          }),
        },
        data: { taskId, type },
      }
    }

    case NotificationTypes.TASK_NEW_MESSAGE: {
      const { conversationId, message, sender, taskId } = metadata as ITaskNewMessageMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].TASK_MESSAGE_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].TASK_MESSAGE_BODY, {
            sender,
            message,
          }),
        },
        data: { taskId, type, conversationId },
      }
    }

    case NotificationTypes.NEW_REQUEST_TASK: {
      const { name, requestTaskId } = metadata as ITaskRequestMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].NEW_REQUEST_TASK_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].NEW_REQUEST_TASK_BODY, {
            name,
          }),
        },
        data: { requestTaskId, type },
      }
    }

    case NotificationTypes.TASK_RATING: {
      const { name, score, taskId } = metadata as ITaskRatingMetadata;
      return {
        notification: {
          title: TRANSLATE_NOTIFICATION[lang].TASK_RATING_TITLE,
          body: buildStringWithIdentifiers(TRANSLATE_NOTIFICATION[lang].TASK_RATING_BODY, {
            name,
            score,
          }),
        },
        data: { taskId, type },
      }
    }
  
    default:
      return null;
  }
}

function buildStringWithIdentifiers(text: string, values: object) {
  return text.replace(/%(\w+)%/g, (match, key) => {
        return values[key] !== undefined ? values[key] : match;
  })
}
