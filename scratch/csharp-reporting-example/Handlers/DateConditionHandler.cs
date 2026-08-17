using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds date predicates for a configured nullable or non-nullable property.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class DateConditionHandler<T> : IReportConditionHandler<T>
{
    private readonly Expression<Func<T, DateOnly?>> _selector;

    /// <summary>Creates a reusable date handler for one allow-listed database field.</summary>
    public DateConditionHandler(string field, Expression<Func<T, DateOnly?>> selector)
    {
        Field = field;
        _selector = selector;
    }

    /// <inheritdoc />
    public string Field { get; }

    /// <inheritdoc />
    public Expression<Func<T, bool>> Build(string @operator, JsonElement value)
    {
        return @operator switch
        {
            "eq" => Compare(ExpressionType.Equal, ParseDate(value)),
            "gte" => Compare(ExpressionType.GreaterThanOrEqual, ParseDate(value)),
            "lte" => Compare(ExpressionType.LessThanOrEqual, ParseDate(value)),
            "between" => BuildBetween(value),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }

    private Expression<Func<T, bool>> Compare(
        ExpressionType comparison,
        DateOnly expected)
    {
        var body = Expression.MakeBinary(
            comparison,
            _selector.Body,
            DateConstant(expected));

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }

    private Expression<Func<T, bool>> BuildBetween(JsonElement value)
    {
        var values = JsonValueReader.GetRequiredStringArray(value, requiredLength: 2);
        var start = ParseDate(values[0]);
        var end = ParseDate(values[1]);

        if (start > end)
        {
            throw new ReportCriteriaException(
                $"The date range for field '{Field}' starts after it ends.");
        }

        // The Vue component defines between as an inclusive range.
        var body = Expression.AndAlso(
            Expression.GreaterThanOrEqual(_selector.Body, DateConstant(start)),
            Expression.LessThanOrEqual(_selector.Body, DateConstant(end)));

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }

    private static DateOnly ParseDate(JsonElement value)
    {
        return ParseDate(JsonValueReader.GetRequiredString(value));
    }

    private static UnaryExpression DateConstant(DateOnly value)
    {
        // Match the nullable selector type while preserving a parameterizable date value.
        return Expression.Convert(Expression.Constant(value), typeof(DateOnly?));
    }

    private static DateOnly ParseDate(string value)
    {
        if (!DateOnly.TryParseExact(
                value,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var result))
        {
            throw new ReportCriteriaException($"'{value}' is not a valid ISO date.");
        }

        return result;
    }
}
