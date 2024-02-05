import { RoomStatus } from './RoomStatus';

export type TimerMessage = {
    roomCode: string;
    roomStatus: RoomStatus;
    seconds: number;
}