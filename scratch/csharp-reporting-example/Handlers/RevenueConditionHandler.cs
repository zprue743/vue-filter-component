using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria.Handlers;

/// <summary>Builds predicates for the stable <c>revenue</c> report field.</summary>
public sealed class RevenueConditionHandler : IReportConditionHandler<ReportRow>
{
    /// <inheritdoc />
    public string Field => "revenue";

    /// <inheritdoc />
    public Expression<Func<ReportRow, bool>> Build(string @operator, JsonElement value)
    {
        var expected = JsonValueReader.GetRequiredDecimal(value);

        return @operator switch
        {
            "eq" => row => row.Revenue == expected,
            "gt" => row => row.Revenue > expected,
            "gte" => row => row.Revenue >= expected,
            "lt" => row => row.Revenue < expected,
            "lte" => row => row.Revenue <= expected,
            _ => throw new ReportCriteriaException(
                $"Operator '{@operator}' is not supported for field '{Field}'.")
        };
    }
}
