using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds set predicates for one UI field backed by allow-listed Boolean columns.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class BooleanFlagsConditionHandler<T> : IReportConditionHandler<T>
{
    private readonly IReadOnlyDictionary<string, Expression<Func<T, bool?>>> _flags;

    /// <summary>Creates a flags handler from stable option values and Boolean selectors.</summary>
    public BooleanFlagsConditionHandler(
        string field,
        IReadOnlyDictionary<string, Expression<Func<T, bool?>>> flags)
    {
        Field = field;
        _flags = flags.ToDictionary(entry => entry.Key, entry => entry.Value, StringComparer.Ordinal);
    }

    /// <inheritdoc />
    public string Field { get; }

    /// <inheritdoc />
    public Expression<Func<T, bool>> Build(string @operator, JsonElement value)
    {
        var selected = JsonValueReader.GetRequiredStringArray(value);
        if (selected.Length == 0)
        {
            throw new ReportCriteriaException(
                $"Field '{Field}' requires at least one selected value.");
        }

        var row = Expression.Parameter(typeof(T), "row");
        var selectedFlags = selected.Select(option => BuildIsTrue(option, row)).ToArray();
        Expression body = @operator switch
        {
            "includes_any" => Combine(selectedFlags, Expression.OrElse),
            "includes_all" => Combine(selectedFlags, Expression.AndAlso),
            "includes_none" => Expression.Not(Combine(selectedFlags, Expression.OrElse)),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };

        return Expression.Lambda<Func<T, bool>>(body, row);
    }

    private Expression BuildIsTrue(string option, ParameterExpression row)
    {
        if (!_flags.TryGetValue(option, out var selector))
        {
            throw new ReportCriteriaException(
                $"Value '{option}' is not supported for field '{Field}'.");
        }

        var body = new ParameterReplaceVisitor(selector.Parameters[0], row)
            .Visit(selector.Body)!;

        // Treat a nullable database flag as selected only when it is explicitly true.
        return Expression.Equal(
            body,
            Expression.Convert(Expression.Constant(true), typeof(bool?)));
    }

    private static Expression Combine(
        IReadOnlyList<Expression> expressions,
        Func<Expression, Expression, BinaryExpression> combine)
    {
        return expressions.Skip(1).Aggregate(expressions[0], combine);
    }

    private sealed class ParameterReplaceVisitor(
        ParameterExpression source,
        ParameterExpression replacement) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node)
        {
            return node == source ? replacement : base.VisitParameter(node);
        }
    }
}
