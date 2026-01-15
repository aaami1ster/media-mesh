/**
 * Service Ports Constants
 * 
 * Defines the port numbers for all MediaMesh microservices.
 * These ports are used in development and Docker Compose configurations.
 */

/**
 * Gateway services ports
 */
export const GatewayPorts = {
  DISCOVERY_GATEWAY: 8080,
  CMS_GATEWAY: 8081,
} as const;

/**
 * Core service ports
 */
export const ServicePorts = {
  AUTH_SERVICE: 8001,
  CMS_SERVICE: 8002,
  METADATA_SERVICE: 8003,
  MEDIA_SERVICE: 8004,
  INGEST_SERVICE: 8005,
  DISCOVERY_SERVICE: 8092,
  SEARCH_SERVICE: 8091,
} as const;

/**
 * Infrastructure service ports
 */
export const InfrastructurePorts = {
  POSTGRES: 5432,
  REDIS: 6379,
  KAFKA_BROKER: 9092,
  KAFKA_UI: 8090,
} as const;

/**
 * All service ports
 */
export const AllServicePorts = {
  ...GatewayPorts,
  ...ServicePorts,
  ...InfrastructurePorts,
} as const;

/**
 * Service name to port mapping
 */
export const ServiceNameToPort: Record<string, number> = {
  'discovery-gateway': GatewayPorts.DISCOVERY_GATEWAY,
  'cms-gateway': GatewayPorts.CMS_GATEWAY,
  'auth-service': ServicePorts.AUTH_SERVICE,
  'cms-service': ServicePorts.CMS_SERVICE,
  'metadata-service': ServicePorts.METADATA_SERVICE,
  'media-service': ServicePorts.MEDIA_SERVICE,
  'ingest-service': ServicePorts.INGEST_SERVICE,
  'discovery-service': ServicePorts.DISCOVERY_SERVICE,
  'search-service': ServicePorts.SEARCH_SERVICE,
  'postgres': InfrastructurePorts.POSTGRES,
  'redis': InfrastructurePorts.REDIS,
  'kafka': InfrastructurePorts.KAFKA_BROKER,
  'kafka-ui': InfrastructurePorts.KAFKA_UI,
};

/**
 * Get port by service name
 */
export function getPortByServiceName(serviceName: string): number | undefined {
  return ServiceNameToPort[serviceName.toLowerCase()];
}

/**
 * Get service name by port
 */
export function getServiceNameByPort(port: number): string | undefined {
  return Object.entries(ServiceNameToPort).find(
    ([, servicePort]) => servicePort === port,
  )?.[0];
}
