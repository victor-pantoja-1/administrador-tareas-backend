import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { NotificationTypes } from '../enums/notifications.enum';
import { buildNotification } from './buildNotifications';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
  IConfigMessageSend,
  ISentPushNotification,
  ITaskAssignationMetadata,
  ITaskChangeStatusMetadata,
  ITaskNewMessageMetadata,
  ITaskRatingMetadata,
  ITaskRequestApprovedMetadata,
	ITaskRequestMetadata
} from '../interfaces/firebase/firebase.interface';
import { SystemScopeEnum } from '../enums/scope.enum';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FirebaseMessagingService {
	private static isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  initialize() {
		if (!FirebaseMessagingService.isInitialized) {
			admin.initializeApp({
				credential: admin.credential.cert({
					clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
					privateKey: this.configService.get('FIREBASE_PRIVATE_KEY'),
					projectId: this.configService.get('FIREBASE_PROJECT_ID'),
				})
			})

			FirebaseMessagingService.isInitialized = true;
		}
  }

  async sendTo(config: IConfigMessageSend) {
    const { notification, tokens, data } = config;
    const notificationsFinished: ISentPushNotification[] = [];

    try {
      for (const token of tokens) {
				let structure: Message = null;

				const origin = token.split('-')[0];
				const parsedToken = token.replace(`${origin}-`, '');

				if (origin === SystemScopeEnum.WEB) {
					structure = {
						token: parsedToken,
						data: { ...data, ...notification } as any,
					};
				} else {
					structure = {
						token: origin === SystemScopeEnum.MOBILE ? parsedToken : token,
						notification,
						data: data as any,
						android: {
							notification: {
								icon: 'stock_ticker_update', // TODO: change icon
								color: '#7e55c3' // TODO: change color
							}
						},
					};
				}

				try {
					const notificationId = await admin.messaging().send(structure);
					notificationsFinished.push({ notificationId, token })
				} catch (error) {
					console.log({ tokenError: token });
				}
      }

      return notificationsFinished;
    } catch (error) {
      console.log(error);
    }
  }

  async sendChatMessage(users: UserEntity[], notificationData: ITaskNewMessageMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.TASK_NEW_MESSAGE,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}

  async sendTaskChangeStatus(users: UserEntity[], notificationData: ITaskChangeStatusMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.TASK_CHANGE_STATUS,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}

  async sendTaskAssignation(users: UserEntity[], notificationData: ITaskAssignationMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.TASK_ASSIGNATIONS,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}

  async sendTaskApproved(users: UserEntity[], notificationData: ITaskRequestApprovedMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.TASK_REQUEST_APPOVED,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}

	async sendRequestTask(users: UserEntity[], notificationData: ITaskRequestMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.NEW_REQUEST_TASK,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}

	async sendTaskRating(users: UserEntity[], notificationData: ITaskRatingMetadata) {
		for (const user of users) {
			const tokens = user?.notificationsTokens ? user.notificationsTokens.split(',') : [];
			const lang = (user as any)?.lang || 'es';

			if (tokens?.length) {
				const notification = buildNotification(
					NotificationTypes.TASK_RATING,
					lang,
					notificationData,
				)

				await this.sendTo({ tokens, ...notification })
			}
		}

		return;
	}
}
