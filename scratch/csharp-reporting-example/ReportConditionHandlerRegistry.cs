using System.Linq.Expressions;

namespace Reporting.Criteria;

/// <summary>Resolves condition handlers from allow-listed field keys.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class ReportConditionHandlerRegistry<T>
{
    private readonly IReadOnlyDictionary<string, IReportConditionHandler<T>> _handlers;

    /// <summary>Creates a registry from the handlers supplied by dependency injection.</summary>
    public ReportConditionHandlerRegistry(IEnumerable<IReportConditionHandler<T>> handlers)
    {
        // Failing on duplicate keys during startup prevents ambiguous field behavior.
        _handlers = handlers.ToDictionary(handler => handler.Field, StringComparer.Ordinal);
    }

    /// <summary>Builds a predicate with the handler registered for the condition field.</summary>
    public Expression<Func<T, bool>> Build(ReportQueryCondition condition)
    {
        if (!_handlers.TryGetValue(condition.Field, out var handler))
        {
            throw new ReportCriteriaException(
                $"Unsupported report field '{condition.Field}'.");
        }

        return handler.Build(condition.Operator, condition.Value);
    }
}
