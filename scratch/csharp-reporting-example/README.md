# C# report predicate example

This directory is an isolated reference implementation for consuming the query tree emitted by the Vue filter component. It is not part of the Vue package build.

The example assumes:

- ASP.NET Core uses `System.Text.Json` with camel-case property names.
- LINQKit is available for `PredicateBuilder` and `AsExpandable`.
- Saved criteria has one root `ReportQueryGroup`.
- An empty root means "no additional filtering"; empty nested groups are invalid.
- Field keys and operators are resolved through backend-owned handlers rather than reflection or client-provided SQL.

Register the handlers and builder with dependency injection:

```csharp
services.AddReportCriteria();
```

Build and apply a predicate:

```csharp
var predicate = predicateBuilder.Build(template.Criteria);

var rows = await dbContext.ReportRows
    .AsNoTracking()
    .AsExpandable()
    .Where(predicate)
    .ToListAsync(cancellationToken);
```

Validation of nesting limits, unique node IDs, field authorization, and permitted values should occur before predicate construction. The handlers still reject unsupported operators and malformed JSON as a defensive boundary.

The sample `ReportRow` and its handlers are placeholders. Replace them with the entity or projection used by the reporting backend and register one handler instance for each stable UI field key.

Each handler contains the parsing and operator behavior for one value type. Fields supply only their stable key and property selector:

```csharp
services.AddSingleton<IReportConditionHandler<ReportRow>>(
    new SelectConditionHandler<ReportRow>("status", row => row.Status));
services.AddSingleton<IReportConditionHandler<ReportRow>>(
    new DateConditionHandler<ReportRow>("createdDate", row => row.CreatedDate));
services.AddSingleton<IReportConditionHandler<ReportRow>>(
    new NumberConditionHandler<ReportRow>("revenue", row => row.Revenue));
```

Additional fields require only another configured handler instance. For example, another date field can reuse `DateConditionHandler<T>` with `"closedDate"` and `row => row.ClosedDate`.

The registry still dispatches by the saved field key, so this remains compatible with the original design and payload. Reusable handlers remove the need for a separate class for every model property.
