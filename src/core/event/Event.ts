export abstract class Event {}

export type EventConstructor<TEvent extends Event = Event> = {
	readonly name: string;
	readonly prototype: TEvent;
};

export interface EventHandler<TEvent extends Event = Event> {
	handle(event: TEvent): Promise<void> | void;
}
