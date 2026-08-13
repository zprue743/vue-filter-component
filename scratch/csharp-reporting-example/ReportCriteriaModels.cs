using System.Text.Json;
using System.Text.Json.Serialization;

namespace Reporting.Criteria;

/// <summary>Base type for nodes in a saved report criteria tree.</summary>
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(ReportQueryGroup), "group")]
[JsonDerivedType(typeof(ReportQueryCondition), "condition")]
public abstract class ReportQueryNode
{
    /// <summary>Gets the stable identifier used to edit this node.</summary>
    public required string Id { get; init; }
}

/// <summary>Combines its immediate child conditions and groups with AND or OR.</summary>
public sealed class ReportQueryGroup : ReportQueryNode
{
    /// <summary>Gets the Boolean combinator, which must be <c>and</c> or <c>or</c>.</summary>
    public required string Combinator { get; init; }

    /// <summary>Gets the ordered conditions and nested groups in this group.</summary>
    public List<ReportQueryNode> Children { get; init; } = [];
}

/// <summary>Applies an operator and JSON value to an allow-listed report field.</summary>
public sealed class ReportQueryCondition : ReportQueryNode
{
    /// <summary>Gets the stable backend-owned field key.</summary>
    public required string Field { get; init; }

    /// <summary>Gets the operator identifier supported by the selected field.</summary>
    public required string Operator { get; init; }

    /// <summary>Gets the typed JSON comparison value.</summary>
    public JsonElement Value { get; init; }
}
