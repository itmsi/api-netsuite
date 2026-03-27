const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');

const traceExporter = new OTLPTraceExporter();

const sdk = new opentelemetry.NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'crm-api'
    }),
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } })]
});

try {
    sdk.start();
    console.log('✅ OpenTelemetry Tracing initialized!');
} catch (error) {
    console.error('❌ Error initializing tracing', error);
}

process.on('SIGTERM', () => {
    sdk.shutdown().then(() => console.log('Tracing terminated')).catch(console.error).finally(() => process.exit(0));
});
