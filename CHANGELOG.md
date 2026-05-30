# Changelog

## 0.4.0

- Add `OutboxMessage` and `OutboxMessageStatus`.
- Add `OutboxRepository` contract.
- Add `OutboxMessageFactory` with injectable clock, id generator and domain
  event serializer.
- Add `InMemoryOutboxRepository` for tests and local development.
- Document outbox usage and transaction boundaries.

## 0.3.0

- Add `DomainEvent`.
- Add `AggregateRoot` with domain event recording, pulling, clearing and
  history replay.
- Keep `AggregateRoot` non-generic to avoid noisy event unions on aggregates
  with many domain events.
- Document domain event usage and transaction boundaries.

## 0.2.0

- Add `Query`, `QueryBus`, `QueryRegistry` and query handler errors.
- Add `Event`, `EventBus`, `EventRegistry` and event handler execution errors.
- Move command/query internals into dedicated `src/core/command` and
  `src/core/query` folders.
- Document command, query and event usage.

## 0.1.0

- Initial public npm release.
- Add `Command`, `CommandBus`, `CommandRegistry` and command handler errors.
- Add npm release workflow.
