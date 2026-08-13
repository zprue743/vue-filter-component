using System.Linq.Expressions;
using LinqKit;

namespace Reporting.Criteria;

/// <summary>Converts a report criteria tree into a composable LINQ predicate.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class ReportPredicateBuilder<T>
{
    private readonly ReportConditionHandlerRegistry<T> _handlers;

    /// <summary>Creates a builder backed by the registered field handlers.</summary>
    public ReportPredicateBuilder(ReportConditionHandlerRegistry<T> handlers)
    {
        _handlers = handlers;
    }

    /// <summary>Builds a predicate from a root criteria group.</summary>
    public Expression<Func<T, bool>> Build(ReportQueryGroup root)
    {
        ArgumentNullException.ThrowIfNull(root);
        return BuildGroup(root, isRoot: true);
    }

    private Expression<Func<T, bool>> BuildGroup(ReportQueryGroup group, bool isRoot)
    {
        if (group.Children.Count == 0)
        {
            if (isRoot)
            {
                // An empty report filter should return all otherwise-eligible rows.
                return entity => true;
            }

            // Empty OR groups would otherwise silently evaluate to false.
            throw new ReportCriteriaException($"Nested group '{group.Id}' cannot be empty.");
        }

        var predicate = group.Combinator switch
        {
            // True and false are the identity values for AND and OR respectively.
            "and" => PredicateBuilder.New<T>(true),
            "or" => PredicateBuilder.New<T>(false),
            _ => throw new ReportCriteriaException(
                $"Unsupported combinator '{group.Combinator}'.")
        };

        foreach (var child in group.Children)
        {
            // Recursion preserves the parentheses represented by nested groups.
            var childPredicate = child switch
            {
                ReportQueryCondition condition => _handlers.Build(condition),
                ReportQueryGroup nestedGroup => BuildGroup(nestedGroup, isRoot: false),
                _ => throw new ReportCriteriaException(
                    $"Unsupported criteria node '{child.GetType().Name}'.")
            };

            predicate = group.Combinator == "and"
                ? predicate.And(childPredicate)
                : predicate.Or(childPredicate);
        }

        return predicate;
    }
}
