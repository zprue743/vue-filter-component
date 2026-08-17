namespace Reporting.Criteria;

/// <summary>Example reporting projection targeted by the predicate handlers.</summary>
public sealed class ReportRow
{
    /// <summary>Gets the row identifier.</summary>
    public long Id { get; init; }

    /// <summary>Gets the stable status value.</summary>
    public required string Status { get; init; }

    /// <summary>Gets the stable region value.</summary>
    public required string Region { get; init; }

    /// <summary>Gets the date the row was created, when supplied by the database.</summary>
    public DateOnly? CreatedDate { get; init; }

    /// <summary>Gets the revenue represented by the row.</summary>
    public decimal Revenue { get; init; }
}
