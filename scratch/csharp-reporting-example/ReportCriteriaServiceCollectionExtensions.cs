using Microsoft.Extensions.DependencyInjection;
using Reporting.Criteria.Handlers;

namespace Reporting.Criteria;

/// <summary>Registers the example report predicate infrastructure.</summary>
public static class ReportCriteriaServiceCollectionExtensions
{
    /// <summary>Adds the report field handlers, registry, and recursive predicate builder.</summary>
    public static IServiceCollection AddReportCriteria(this IServiceCollection services)
    {
        services.AddSingleton<IReportConditionHandler<ReportRow>, StatusConditionHandler>();
        services.AddSingleton<IReportConditionHandler<ReportRow>, CreatedDateConditionHandler>();
        services.AddSingleton<IReportConditionHandler<ReportRow>, RevenueConditionHandler>();
        services.AddSingleton<ReportConditionHandlerRegistry<ReportRow>>();
        services.AddSingleton<ReportPredicateBuilder<ReportRow>>();

        return services;
    }
}
