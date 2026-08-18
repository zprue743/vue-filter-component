using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds select predicates for a configured 64-bit integer field.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class Int64SelectConditionHandler<T> : IReportConditionHandler<T>
{
    private readonly Expression<Func<T, long>> _selector;

    /// <summary>Creates a reusable select handler for one allow-listed 64-bit integer field.</summary>
    public Int64SelectConditionHandler(string field, Expression<Func<T, long>> selector)
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
            "eq" => Compare(value, negate: false),
            "neq" => Compare(value, negate: true),
            "in" => BuildMembership(value, negate: false),
            "not_in" => BuildMembership(value, negate: true),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }

    private Expression<Func<T, bool>> Compare(JsonElement value, bool negate)
    {
        var expected = Expression.Constant(JsonValueReader.GetRequiredInt64(value));
        var body = negate
            ? Expression.NotEqual(_selector.Body, expected)
            : Expression.Equal(_selector.Body, expected);

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }

    private Expression<Func<T, bool>> BuildMembership(JsonElement value, bool negate)
    {
        var expected = JsonValueReader.GetRequiredInt64Array(value);
        var contains = Expression.Call(
            typeof(Enumerable),
            nameof(Enumerable.Contains),
            [typeof(long)],
            Expression.Constant(expected),
            _selector.Body);
        Expression body = negate ? Expression.Not(contains) : contains;

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }
}
