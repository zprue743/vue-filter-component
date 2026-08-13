using System.Globalization;
using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds predicates for the stable <c>createdDate</c> report field.</summary>
public sealed class CreatedDateConditionHandler : IReportConditionHandler<ReportRow>
{
    /// <inheritdoc />
    public string Field => "createdDate";

    /// <inheritdoc />
    public Expression<Func<ReportRow, bool>> Build(string @operator, JsonElement value)
    {
        return @operator switch
        {
            "eq" => BuildOn(value),
            "gte" => BuildOnOrAfter(value),
            "lte" => BuildOnOrBefore(value),
            "between" => BuildBetween(value),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }

    private static Expression<Func<ReportRow, bool>> BuildOn(JsonElement value)
    {
        var expected = ParseDate(JsonValueReader.GetRequiredString(value));
        return row => row.CreatedDate == expected;
    }

    private static Expression<Func<ReportRow, bool>> BuildOnOrAfter(JsonElement value)
    {
        var minimum = ParseDate(JsonValueReader.GetRequiredString(value));
        return row => row.CreatedDate >= minimum;
    }

    private static Expression<Func<ReportRow, bool>> BuildOnOrBefore(JsonElement value)
    {
        var maximum = ParseDate(JsonValueReader.GetRequiredString(value));
        return row => row.CreatedDate <= maximum;
    }

    private static Expression<Func<ReportRow, bool>> BuildBetween(JsonElement value)
    {
        var values = JsonValueReader.GetRequiredStringArray(value, requiredLength: 2);
        var start = ParseDate(values[0]);
        var end = ParseDate(values[1]);

        if (start > end)
        {
            throw new ReportCriteriaException(
                "The created-date range starts after it ends.");
        }

        // The Vue component defines between as an inclusive range.
        return row => row.CreatedDate >= start && row.CreatedDate <= end;
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
