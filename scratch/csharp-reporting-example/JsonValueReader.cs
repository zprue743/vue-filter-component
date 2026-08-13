using System.Text.Json;

namespace Reporting.Criteria;

/// <summary>Provides strict conversions from stored JSON condition values.</summary>
public static class JsonValueReader
{
    /// <summary>Reads a required non-null JSON string.</summary>
    public static string GetRequiredString(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.String)
        {
            throw new ReportCriteriaException("The condition value must be a string.");
        }

        return value.GetString()
            ?? throw new ReportCriteriaException("The condition value cannot be null.");
    }

    /// <summary>Reads an array containing only non-null JSON strings.</summary>
    public static string[] GetRequiredStringArray(
        JsonElement value,
        int? requiredLength = null)
    {
        if (value.ValueKind != JsonValueKind.Array)
        {
            throw new ReportCriteriaException("The condition value must be an array.");
        }

        var values = value.EnumerateArray().Select(GetRequiredString).ToArray();

        if (requiredLength is not null && values.Length != requiredLength)
        {
            throw new ReportCriteriaException(
                $"The condition requires exactly {requiredLength} values.");
        }

        return values;
    }

    /// <summary>Reads a required JSON decimal number without string coercion.</summary>
    public static decimal GetRequiredDecimal(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Number || !value.TryGetDecimal(out var result))
        {
            throw new ReportCriteriaException(
                "The condition value must be a decimal number.");
        }

        return result;
    }
}
