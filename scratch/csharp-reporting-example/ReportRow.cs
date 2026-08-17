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

    /// <summary>Gets the codes assigned to the row by the database view.</summary>
    public string[] Codes { get; init; } = [];

    /// <summary>Gets whether the first synthetic label applies to the row.</summary>
    public bool Label1 { get; init; }

    /// <summary>Gets whether the second synthetic label applies to the row.</summary>
    public bool Label2 { get; init; }

    /// <summary>Gets the date the row was created, when supplied by the database.</summary>
    public DateOnly? CreatedDate { get; init; }

    /// <summary>Gets the revenue represented by the row.</summary>
    public decimal Revenue { get; init; }
}
