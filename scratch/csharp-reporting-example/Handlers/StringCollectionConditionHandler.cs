using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds set predicates for a configured string-array field.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public sealed class StringCollectionConditionHandler<T> : IReportConditionHandler<T>
{
    private readonly Expression<Func<T, string[]>> _selector;

    /// <summary>Creates a collection handler for one allow-listed string-array field.</summary>
    public StringCollectionConditionHandler(
        string field,
        Expression<Func<T, string[]>> selector)
    {
        Field = field;
        _selector = selector;
    }

    /// <inheritdoc />
    public string Field { get; }

    /// <inheritdoc />
    public Expression<Func<T, bool>> Build(string @operator, JsonElement value)
    {
        var selected = GetRequiredValues(value);

        return @operator switch
        {
            "includes_any" => BuildIncludesAny(selected, negate: false),
            "includes_all" => BuildIncludesAll(selected),
            "includes_none" => BuildIncludesAny(selected, negate: true),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }

    private Expression<Func<T, bool>> BuildIncludesAny(string[] selected, bool negate)
    {
        var item = Expression.Parameter(typeof(string), "item");
        var isSelected = Expression.Call(
            typeof(Enumerable),
            nameof(Enumerable.Contains),
            [typeof(string)],
            Expression.Constant(selected),
            item);
        var any = Expression.Call(
            typeof(Enumerable),
            nameof(Enumerable.Any),
            [typeof(string)],
            _selector.Body,
            Expression.Lambda<Func<string, bool>>(isSelected, item));
        Expression body = negate ? Expression.Not(any) : any;

        return Expression.Lambda<Func<T, bool>>(body, _selector.Parameters);
    }

    private Expression<Func<T, bool>> BuildIncludesAll(string[] selected)
    {
        var item = Expression.Parameter(typeof(string), "item");
        var fieldContainsItem = Expression.Call(
            typeof(Enumerable),
            nameof(Enumerable.Contains),
            [typeof(string)],
            _selector.Body,
            item);
        var all = Expression.Call(
            typeof(Enumerable),
            nameof(Enumerable.All),
            [typeof(string)],
            Expression.Constant(selected),
            Expression.Lambda<Func<string, bool>>(fieldContainsItem, item));

        return Expression.Lambda<Func<T, bool>>(all, _selector.Parameters);
    }

    private string[] GetRequiredValues(JsonElement value)
    {
        var selected = JsonValueReader.GetRequiredStringArray(value);
        if (selected.Length == 0)
        {
            throw new ReportCriteriaException(
                $"Field '{Field}' requires at least one selected value.");
        }

        return selected;
    }
}
