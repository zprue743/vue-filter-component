using System.Text.Json;

namespace Reporting.Criteria;

/// <summary>Provides strict conversions from stored JSON condition values.</summary>
public static class JsonValueReader
{
    /// <summary>
    /// Reads a required 64-bit integer from a JSON string or integer token.
    /// String values preserve the full <see cref="long"/> range across JavaScript clients.
    /// </summary>
    public static long GetRequiredInt64(JsonElement value)
    {
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var number))
        {
            return number;
        }

        if (value.ValueKind == JsonValueKind.String
            && long.TryParse(
                value.GetString(),
                System.Globalization.NumberStyles.Integer,
                System.Globalization.CultureInfo.InvariantCulture,
                out var textNumber))
        {
            return textNumber;
        }

        throw new ReportCriteriaException(
            "The condition value must be a 64-bit integer or its string representation.");
    }

    /// <summary>Reads an array containing only valid 64-bit integer values.</summary>
    public static long[] GetRequiredInt64Array(JsonElement value)
    {
        if (value.ValueKind != JsonValueKind.Array)
        {
            throw new ReportCriteriaException("The condition value must be an array.");
        }

        return value.EnumerateArray().Select(GetRequiredInt64).ToArray();
    }

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
