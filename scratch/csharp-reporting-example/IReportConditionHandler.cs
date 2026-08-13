using System.Linq.Expressions;
using System.Text.Json;

namespace Reporting.Criteria;

/// <summary>Converts conditions for one report field into LINQ expressions.</summary>
/// <typeparam name="T">The entity or projection being filtered.</typeparam>
public interface IReportConditionHandler<T>
{
    /// <summary>Gets the stable field key used in saved report criteria.</summary>
    string Field { get; }

    /// <summary>Builds a predicate for one field condition.</summary>
    Expression<Func<T, bool>> Build(string @operator, JsonElement value);
}
