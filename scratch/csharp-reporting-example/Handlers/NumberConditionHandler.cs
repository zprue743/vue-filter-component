using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds numeric predicates for a configured decimal field and property selector.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class NumberConditionHandler<T> : IReportConditionHandler<T>
{
    private readonly Expression<Func<T, decimal>> _selector;

    /// <summary>Creates a reusable number handler for one allow-listed decimal field.</summary>
    public NumberConditionHandler(string field, Expression<Func<T, decimal>> selector)
    {
        Field = field;
        _selector = selector;
    }

    /// <inheritdoc />
    public string Field { get; }

    /// <inheritdoc />
    public Expression<Func<T, bool>> Build(string @operator, JsonElement value)
    {
        var expected = JsonValueReader.GetRequiredDecimal(value);
        var comparison = @operator switch
        {
            "eq" => ExpressionType.Equal,
            "gt" => ExpressionType.GreaterThan,
            "gte" => ExpressionType.GreaterThanOrEqual,
            "lt" => ExpressionType.LessThan,
            "lte" => ExpressionType.LessThanOrEqual,
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };

        var body = Expression.MakeBinary(
            comparison,
            _selector.Body,
            Expression.Constant(expected));

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }
}
