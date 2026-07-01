// Textos de ayuda contextual centralizados.
// Un solo lugar para mantener, sin duplicaciones en componentes.

export const helpTexts = {

  // ─── Perfil ────────────────────────────────────────────────────────────────

  profile: {
    startingPoint:
      'Define el modelo base de cálculo. No es lo mismo estimar ROI para un cliente sin APM que para uno que busca reemplazar una herramienta comercial u optimizar una solución open source.',
    evalDriver:
      'Representa la principal razón por la que el cliente evalúa Instana. Ayuda a clasificar el tipo de ROI: costo, cobertura, eficiencia operativa, consolidación o reducción de riesgo.',
    horizon:
      'Período usado para proyectar beneficios, costos y payback. Un horizonte corto puede mostrar ROI negativo si la inversión se recupera más adelante.',
    currency:
      'Moneda usada para costos, ahorros y resultados financieros. El simulador no convierte divisas automáticamente.',
    industry:
      'Define el costo estimado por hora de equipo cuando no se ingresa un valor real. Cada industria tiene un benchmark diferente.',
  },

  // ─── Alcance ───────────────────────────────────────────────────────────────

  scope: {
    appCount:
      'Permite estimar el tamaño del alcance de observabilidad. Si no se conoce el número exacto, seleccione un rango aproximado.',
    criticality:
      'Indica el impacto potencial de una falla. Las aplicaciones críticas tienen mayor costo de indisponibilidad, mayor esfuerzo de soporte y mayor necesidad de observabilidad.',
    operationHours:
      'Define la exposición operativa del servicio. Un servicio 24×7 tiene mayor ventana de impacto potencial que uno 8×5.',
    affectsExternalClients:
      'Si afecta clientes externos, el impacto puede incluir reclamos, pérdida de experiencia de usuario, daño reputacional o ingresos no generados.',
    processesEconomicTransactions:
      'Permite estimar si una falla afecta ingresos, pagos, ventas, transferencias u otros procesos financieros críticos del negocio.',
    hasSlAorRegulatory:
      'Indica si existen compromisos contractuales, regulatorios o de servicio que puedan generar penalidades o exposición legal ante incidentes.',
  },

  // ─── Incidentes ────────────────────────────────────────────────────────────

  incidents: {
    incidentFrequency:
      'Cantidad estimada de incidentes relevantes por mes. Si el cliente no tiene métricas históricas, use un rango aproximado. Es la variable que más impacta el costo de war rooms.',
    mttd:
      'Tiempo promedio desde que ocurre un problema hasta que el equipo lo detecta (MTTD). Un MTTD bajo reduce el impacto y acelera la respuesta. Instana busca reducir este tiempo con detección automática.',
    mttr:
      'Tiempo promedio desde que se detecta el incidente hasta que se resuelve (MTTR). Es una de las variables más importantes del ROI operativo. La reducción de MTTR es el beneficio más tangible de la observabilidad.',
    warRoomDuration:
      'Tiempo promedio que los equipos permanecen reunidos investigando o resolviendo un incidente. A mayor duración, mayor costo de war room.',
    warRoomPeople:
      'Cantidad de personas que participan en la resolución. Junto con la duración y frecuencia, determina las horas hombre totales consumidas por incidentes.',
    hourlyCost:
      'Costo promedio por hora de las personas involucradas en el war room. Si no se conoce, se puede usar el valor estimado por industria, que es un benchmark típico del sector.',
    rootCause:
      'Indica si el equipo suele identificar la causa raíz durante el incidente. Si raramente se logra, existe mayor riesgo de recurrencia y se justifica una inversión en observabilidad más profunda.',
  },

  // ─── Bloques opcionales ────────────────────────────────────────────────────

  blocks: {
    commercial_apm:
      'Usar cuando el cliente ya cuenta con herramientas como Dynatrace, New Relic, Datadog o AppDynamics. Permite calcular ROI por reemplazo, racionalización de licencias, cobertura ampliada y control de costo.',
    open_source:
      'Usar cuando el cliente opera Prometheus, Grafana, ELK, Jaeger, Loki, Tempo u otras herramientas open source. Aunque no hay licenciamiento, puede haber costos de infraestructura, administración y mantenimiento que se comparan contra Instana.',
    otel:
      'Usar cuando el cliente tiene o quiere adoptar instrumentación basada en estándares abiertos (OpenTelemetry). Ayuda a evaluar interoperabilidad, portabilidad y reducción de vendor lock-in.',
    governance:
      'Evalúa el control sobre logs, métricas, trazas, retención, cardinalidad y crecimiento de datos. Es clave para estimar costos de almacenamiento futuros y evitar sorpresas en facturación.',
    fragmentation:
      'Evalúa cuántas herramientas se usan para investigar incidentes y cuánto esfuerzo se pierde correlacionando información manualmente entre consolas distintas.',
    migration:
      'Usar cuando Instana convivirá temporalmente con una herramienta actual. La coexistencia puede generar doble costo de licencia y afectar el payback durante la transición.',
    slo_sla:
      'Evalúa si el cliente mide disponibilidad, latencia, degradación y experiencia desde una perspectiva de nivel de servicio. Incluye SLO/SLA, monitoreo sintético y RUM.',
    security:
      'Evalúa restricciones de uso, datos sensibles, residencia de datos, auditoría o requisitos regulatorios que puedan afectar la viabilidad o el alcance del despliegue.',
  },

  // ─── Costos Instana ────────────────────────────────────────────────────────

  instanaCosts: {
    annualLicense:
      'Costo anual estimado de la plataforma Instana. No representa una cotización oficial. Ingresar el valor de la propuesta comercial recibida o un estimado para la simulación.',
    implementation:
      'Costo inicial asociado a instalación, configuración, onboarding o despliegue. Se distribuye en el horizonte de evaluación para calcular el TCO anual.',
    training:
      'Costo estimado para habilitar a los equipos técnicos y operativos que usarán o administrarán la solución.',
    professionalServices:
      'Consultoría, integración y acompañamiento técnico para acelerar la adopción. Incluye servicios de IBM o socios de implementación.',
    internalOperation:
      'Tiempo o esfuerzo del equipo interno del cliente para operar y mantener la solución (administración, configuración, actualizaciones).',
    logsAndSynthetic:
      'Costos complementarios que pueden aplicar según el alcance del proyecto: logs avanzados, monitoreo sintético, RUM u otros módulos. Deben ajustarse con una cotización oficial.',
    deploymentModel:
      'Define si la estimacion se basa en Instana SaaS o Self-Hosted. Algunos add-ons aplican de forma distinta segun el modelo.',
    standardApm:
      'IBM Instana Observability Standard, conocido comercialmente como APM. Usar para la linea base de monitoreo de aplicaciones y servicios distribuidos.',
    essentialsIqm:
      'IBM Instana Observability Essentials, conocido comercialmente como IQM. Usar cuando el cliente combine esta linea con Standard/APM.',
    mvs:
      'MVS significa Monitored Virtual Server o agente referencial en esta herramienta. Validar cantidades y minimos con cotizacion oficial.',
    saas:
      'Instana SaaS operado como servicio. Puede tener add-ons como fair use, data ingest, logs o Managed PoP segun configuracion comercial.',
    selfHosted:
      'Instana Self-Hosted / On-Premise. Requiere validar infraestructura, sizing, operacion y componentes incluidos segun licencia.',
    fairUse:
      'Volumen incluido estimado para data ingest. El simulador permite calcularlo automaticamente desde MVS o ingresarlo manualmente.',
    dataIngest:
      'Volumen mensual esperado de datos ingeridos. Evitar doble conteo con logs u otros componentes de la cotizacion.',
    logsInContext:
      'Capacidad de analizar logs en contexto de aplicaciones, servicios e incidentes. Su aplicabilidad cambia entre SaaS y Self-Hosted.',
    retention:
      'Periodo de retencion considerado para logs. Puede impactar unidades compradas, almacenamiento y costo mensual.',
    resourceUnits:
      'Resource Units usadas para estimar ejecuciones de Synthetic Monitoring desde IBM Hosted Public PoP.',
    managedPop:
      'Managed PoP aplica cuando las ejecuciones synthetic se realizan desde puntos publicos IBM Hosted. No aplica a PoPs propios o Self-Hosted.',
    customerPrivatePop:
      'PoP operado por el cliente. En este modo no se agrega costo Managed PoP en el estimador.',
    descuento:
      'Ajuste comercial referencial. No representa descuento garantizado y debe validarse con el proceso comercial correspondiente.',
    precioReferencial:
      'Precio editable usado solo para simulacion. No es precio oficial ni reemplaza una cotizacion formal.',
  },

  // ─── Dashboard / Resultados ────────────────────────────────────────────────

  dashboard: {
    roi:
      'Relación entre el beneficio estimado y el costo considerado. Un ROI negativo no siempre indica error: puede significar que el beneficio no supera la inversión dentro del horizonte seleccionado.',
    payback:
      'Mes estimado en que se recupera la inversión inicial. Si el beneficio neto mensual es cero o negativo, el payback se muestra como "no aplica" en el horizonte evaluado.',
    tcoActual:
      'Costo total estimado de la situación actual: herramientas, infraestructura, administración, operación y costos de incidentes.',
    tcoInstana:
      'Costo total estimado del escenario con Instana: licencia anual, implementación, operación interna, transición y componentes adicionales.',
    grossBenefit:
      'Suma de ahorros y costos evitados estimados, antes de descontar el costo de Instana. Incluye reducción de war rooms, administración, infraestructura y cobertura.',
    netBenefit:
      'Resultado financiero después de considerar el costo de Instana. Un valor positivo indica que los beneficios superan la inversión dentro del horizonte.',
    confidence:
      'Indica qué tan sólido es el cálculo según la cantidad de datos reales ingresados versus datos estimados o desconocidos. A mayor porcentaje de datos reales, más confiable es el resultado.',
    warRoomCost:
      'Estimación del costo anual de los war rooms basada en frecuencia de incidentes, duración, cantidad de personas y costo hora del equipo.',
  },

  // ─── Scores ───────────────────────────────────────────────────────────────

  scores: {
    costPressure:
      'Mide la presión financiera del modelo actual de APM o monitoreo: costo elevado, consumo impredecible, restricciones por costo.',
    apmUtilization:
      'Mide cuánto se aprovechan las capacidades disponibles o contratadas de la herramienta actual. Un score bajo indica que se paga por funcionalidades que no se usan.',
    coverageRestriction:
      'Mide si el costo o la complejidad limitan la cobertura de observabilidad: aplicaciones sin monitorear, instrumentación evitada por precio.',
    operationalDrag:
      'Mide el esfuerzo operativo asociado a incidentes, war rooms y diagnóstico manual. Un score alto indica alta carga operativa que se podría reducir.',
    telemetryWaste:
      'Mide el riesgo de desperdicio o crecimiento no controlado de logs, métricas y trazas. Relevante para controlar costos de almacenamiento y procesamiento.',
    fragmentation:
      'Mide el nivel de dispersión entre herramientas y correlación manual durante incidentes. Un score alto indica pérdida de tiempo significativa.',
    otelReadiness:
      'Mide la preparación para adoptar instrumentación basada en estándares abiertos (OpenTelemetry). Incluye nivel de adopción, uso de collector y estándares internos.',
    migrationEffort:
      'Mide la complejidad estimada de transición desde la situación actual hacia Instana: instrumentación, dashboards, alertas, integraciones.',
    adoptionReadiness:
      'Mide la probabilidad de adopción efectiva por los equipos técnicos y operativos: dependencia de especialistas, soporte, documentación.',
    roiConfidence:
      'Refleja la calidad de los datos usados en la simulación. Equivale al nivel de confianza del cálculo: a más datos reales, mayor score.',
  },

  // ─── Editor de supuestos ──────────────────────────────────────────────────

  scenarioEditor: {
    general:
      'Los supuestos de escenario permiten ajustar los porcentajes de mejora esperados para simular casos conservador, esperado y optimista. No representan garantías de IBM o Instana. El motor usa el promedio del rango min–max para calcular los ahorros.',
    minMax:
      'Rango porcentual de mejora para este parámetro en este escenario. El motor usa el promedio del rango. Min no puede ser mayor que max. Valores entre 0 y 100.',
    restoreDefaults:
      'Vuelve a los supuestos recomendados por defecto sin borrar los datos del cliente ya ingresados.',
    mttrReduction:
      'Mejora en tiempo de resolución de incidentes (MTTR). Afecta el beneficio por reducción de horas hombre durante incidentes críticos.',
    mttdReduction:
      'Mejora en tiempo de detección de incidentes (MTTD). Contribuye a la reducción del impacto total de los incidentes.',
    warRoomReduction:
      'Porcentaje de reducción estimado en horas hombre de war rooms. Es el parámetro de mayor impacto en el ROI operativo.',
    adminReduction:
      'Ahorro estimado en tareas de administración de la plataforma APM u open source actual. Incluye mantenimiento, upgrades y soporte.',
    coverageImprovement:
      'Porcentaje de mejora en cobertura de observabilidad. Afecta el valor estimado de las aplicaciones que hoy no se monitorean o se monitorean parcialmente.',
    fragmentationReduction:
      'Reducción del esfuerzo perdido en correlación manual entre herramientas durante incidentes. Solo aplica cuando el bloque de fragmentación está activo.',
  },

} as const;

export type HelpTextSection = keyof typeof helpTexts;
