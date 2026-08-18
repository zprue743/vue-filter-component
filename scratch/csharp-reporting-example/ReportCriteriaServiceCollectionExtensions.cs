using System.Linq.Expressions;
using Microsoft.Extensions.DependencyInjection;
using Reporting.Criteria.Handlers;

namespace Reporting.Criteria;

/// <summary>Registers the example report predicate infrastructure.</summary>
public static class ReportCriteriaServiceCollectionExtensions
{
    /// <summary>Adds the report field handlers, registry, and recursive predicate builder.</summary>
    public static IServiceCollection AddReportCriteria(this IServiceCollection services)
    {
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new SelectConditionHandler<ReportRow>("status", row => row.Status));
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new Int64SelectConditionHandler<ReportRow>("customerId", row => row.Id));
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new DateConditionHandler<ReportRow>("createdDate", row => row.CreatedDate));
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new NumberConditionHandler<ReportRow>("revenue", row => row.Revenue));
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new StringCollectionConditionHandler<ReportRow>("codes", row => row.Codes));
        services.AddSingleton<IReportConditionHandler<ReportRow>>(
            new BooleanFlagsConditionHandler<ReportRow>(
                "labels",
                new Dictionary<string, Expression<Func<ReportRow, bool?>>>(StringComparer.Ordinal)
                {
                    ["label1"] = row => row.Label1,
                    ["label2"] = row => row.Label2
                }));
        services.AddSingleton<ReportConditionHandlerRegistry<ReportRow>>();
        services.AddSingleton<ReportPredicateBuilder<ReportRow>>();

        return services;
    }
}
