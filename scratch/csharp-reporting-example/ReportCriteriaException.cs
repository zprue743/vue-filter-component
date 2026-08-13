namespace Reporting.Criteria;

/// <summary>Indicates that submitted or stored report criteria cannot be interpreted safely.</summary>
public sealed class ReportCriteriaException : Exception
{
    /// <summary>Initializes an exception with a user-safe validation message.</summary>
    public ReportCriteriaException(string message)
        : base(message)
    {
    }
}
