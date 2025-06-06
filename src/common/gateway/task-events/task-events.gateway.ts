import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { TaskEvents } from 'src/common/enums/task-events.enum';
import { SocketMiddleware } from 'src/common/middleware/socket/socket.middleware';

@WebSocketGateway({
	namespace: '/api/v1/task-events',
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
})
export class TaskEventsGateway implements OnGatewayConnection {
	@WebSocketServer() server;

	//TODO evaluar la autenticacion de sockets, porque esta creando dependencia circular

	 /* afterInit(client: Socket) {
		client.use(SocketMiddleware() as any);
	}  */

	handleConnection(client: Socket) {
	}

	@SubscribeMessage(TaskEvents.TASK_CREATED)
	handleEvent(
		@MessageBody() data: string,
		@ConnectedSocket() client: Socket,
	): void {
		client.broadcast.emit('eventFromServer', data);
	}
}
