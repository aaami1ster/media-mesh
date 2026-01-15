/**
 * Event versioning utilities
 */

/**
 * Parse semantic version string (e.g., "1.2.3")
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const parts = version.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
  };
}

/**
 * Compare two versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (parsed1.major !== parsed2.major) {
    return parsed1.major > parsed2.major ? 1 : -1;
  }
  if (parsed1.minor !== parsed2.minor) {
    return parsed1.minor > parsed2.minor ? 1 : -1;
  }
  if (parsed1.patch !== parsed2.patch) {
    return parsed1.patch > parsed2.patch ? 1 : -1;
  }
  return 0;
}

/**
 * Check if version is compatible (same major version)
 */
export function isCompatibleVersion(v1: string, v2: string): boolean {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);
  return parsed1.major === parsed2.major;
}

/**
 * Get latest version from array of versions
 */
export function getLatestVersion(versions: string[]): string {
  if (versions.length === 0) {
    throw new Error('No versions provided');
  }

  return versions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
}

/**
 * Event version constants
 */
export const EVENT_VERSIONS = {
  V1_0_0: '1.0.0',
  V1_1_0: '1.1.0',
  V2_0_0: '2.0.0',
} as const;

/**
 * Current event version
 */
export const CURRENT_EVENT_VERSION = EVENT_VERSIONS.V1_0_0;

/**
 * Migrate event to target version
 * This is a placeholder - implement actual migration logic as needed
 */
export function migrateEvent(
  event: any,
  targetVersion: string,
): any {
  const currentVersion = event.metadata?.eventVersion || CURRENT_EVENT_VERSION;

  if (compareVersions(currentVersion, targetVersion) === 0) {
    return event; // Already at target version
  }

  if (compareVersions(currentVersion, targetVersion) > 0) {
    throw new Error(
      `Cannot downgrade event from ${currentVersion} to ${targetVersion}`,
    );
  }

  // TODO: Implement migration logic based on version differences
  // For now, just update the version
  return {
    ...event,
    metadata: {
      ...event.metadata,
      eventVersion: targetVersion,
    },
  };
}
