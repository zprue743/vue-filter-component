using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds predicates for the stable <c>status</c> report field.</summary>
public sealed class StatusConditionHandler : IReportConditionHandler<ReportRow>
{
    /// <inheritdoc />
    public string Field => "status";

    /// <inheritdoc />
    public Expression<Func<ReportRow, bool>> Build(string @operator, JsonElement value)
    {
        return @operator switch
        {
            "eq" => BuildEquals(value),
            "neq" => BuildNotEquals(value),
            "in" => BuildIn(value),
            "not_in" => BuildNotIn(value),
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }

    private static Expression<Func<ReportRow, bool>> BuildEquals(JsonElement value)
    {
        var expected = JsonValueReader.GetRequiredString(value);

        // Parse outside the expression so EF receives a parameterizable value.
        return row => row.Status == expected;
    }

    private static Expression<Func<ReportRow, bool>> BuildNotEquals(JsonElement value)
    {
        var expected = JsonValueReader.GetRequiredString(value);
        return row => row.Status != expected;
    }

    private static Expression<Func<ReportRow, bool>> BuildIn(JsonElement value)
    {
        var expected = JsonValueReader.GetRequiredStringArray(value);

        // EF translates Contains over a local collection into a membership operation.
        return row => expected.Contains(row.Status);
    }

    private static Expression<Func<ReportRow, bool>> BuildNotIn(JsonElement value)
    {
        var excluded = JsonValueReader.GetRequiredStringArray(value);
        return row => !excluded.Contains(row.Status);
    }
}
