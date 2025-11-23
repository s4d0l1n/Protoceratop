/**
 * Icon Library
 * Tabler Icons (MIT License) - curated selection for threat hunting visualization
 */

export interface IconDefinition {
  name: string
  path: string
  category: string
  description: string
}

export const ICON_CATEGORIES = [
  'Devices',
  'Users & Security',
  'Network',
  'Files & Code',
  'Alerts & Status',
  'Infrastructure',
  'Data',
  'Other',
] as const

export type IconCategory = typeof ICON_CATEGORIES[number]

/**
 * Available icons organized by category
 */
export const AVAILABLE_ICONS: IconDefinition[] = [
  // Devices
  { name: 'Server', path: '/icons/server.svg', category: 'Devices', description: 'Server' },
  { name: 'Server (Alt)', path: '/icons/server-2.svg', category: 'Devices', description: 'Alternative server icon' },
  { name: 'Desktop', path: '/icons/device-desktop.svg', category: 'Devices', description: 'Desktop computer' },
  { name: 'Laptop', path: '/icons/device-laptop.svg', category: 'Devices', description: 'Laptop computer' },
  { name: 'Mobile', path: '/icons/device-mobile.svg', category: 'Devices', description: 'Mobile device' },
  { name: 'Router', path: '/icons/router.svg', category: 'Devices', description: 'Network router' },

  // Users & Security
  { name: 'User', path: '/icons/user.svg', category: 'Users & Security', description: 'Single user' },
  { name: 'Users', path: '/icons/users.svg', category: 'Users & Security', description: 'Multiple users' },
  { name: 'User Shield', path: '/icons/user-shield.svg', category: 'Users & Security', description: 'Protected user' },
  { name: 'Shield', path: '/icons/shield.svg', category: 'Users & Security', description: 'Security shield' },
  { name: 'Shield Check', path: '/icons/shield-check.svg', category: 'Users & Security', description: 'Verified security' },
  { name: 'Lock', path: '/icons/lock.svg', category: 'Users & Security', description: 'Locked/secured' },
  { name: 'Key', path: '/icons/key.svg', category: 'Users & Security', description: 'Access key' },
  { name: 'Password', path: '/icons/password.svg', category: 'Users & Security', description: 'Password' },
  { name: 'Firewall', path: '/icons/firewall.svg', category: 'Users & Security', description: 'Firewall' },

  // Network
  { name: 'Network', path: '/icons/network.svg', category: 'Network', description: 'Network connection' },
  { name: 'Cloud', path: '/icons/cloud.svg', category: 'Network', description: 'Cloud service' },
  { name: 'WiFi', path: '/icons/wifi.svg', category: 'Network', description: 'Wireless network' },
  { name: 'World', path: '/icons/world.svg', category: 'Network', description: 'Internet/world' },
  { name: 'Globe', path: '/icons/globe.svg', category: 'Network', description: 'Global network' },
  { name: 'Link', path: '/icons/link.svg', category: 'Network', description: 'Connection link' },
  { name: 'Unlink', path: '/icons/unlink.svg', category: 'Network', description: 'Disconnected' },
  { name: 'Topology Star', path: '/icons/topology-star.svg', category: 'Network', description: 'Star topology' },
  { name: 'Sitemap', path: '/icons/sitemap.svg', category: 'Network', description: 'Network sitemap' },

  // Files & Code
  { name: 'File', path: '/icons/file.svg', category: 'Files & Code', description: 'File' },
  { name: 'Folder', path: '/icons/folder.svg', category: 'Files & Code', description: 'Folder' },
  { name: 'Code', path: '/icons/code.svg', category: 'Files & Code', description: 'Source code' },
  { name: 'Terminal', path: '/icons/terminal.svg', category: 'Files & Code', description: 'Command terminal' },
  { name: 'Git Branch', path: '/icons/git-branch.svg', category: 'Files & Code', description: 'Git branch' },
  { name: 'Binary Tree', path: '/icons/binary-tree.svg', category: 'Files & Code', description: 'Tree structure' },

  // Alerts & Status
  { name: 'Alert Triangle', path: '/icons/alert-triangle.svg', category: 'Alerts & Status', description: 'Warning' },
  { name: 'Alert Circle', path: '/icons/alert-circle.svg', category: 'Alerts & Status', description: 'Alert notification' },
  { name: 'Alert Octagon', path: '/icons/alert-octagon.svg', category: 'Alerts & Status', description: 'Stop/critical alert' },
  { name: 'Bug', path: '/icons/bug.svg', category: 'Alerts & Status', description: 'Bug/malware' },

  // Infrastructure
  { name: 'Building', path: '/icons/building.svg', category: 'Infrastructure', description: 'Building/organization' },
  { name: 'Home', path: '/icons/home.svg', category: 'Infrastructure', description: 'Home/local' },
  { name: 'Windows', path: '/icons/brand-windows.svg', category: 'Infrastructure', description: 'Windows OS' },
  { name: 'Apple', path: '/icons/brand-apple.svg', category: 'Infrastructure', description: 'Apple/macOS' },
  { name: 'Android', path: '/icons/brand-android.svg', category: 'Infrastructure', description: 'Android OS' },
  { name: 'Linux', path: '/icons/brand-linux.svg', category: 'Infrastructure', description: 'Linux OS' },

  // Data
  { name: 'Database', path: '/icons/database.svg', category: 'Data', description: 'Database' },
  { name: 'Database Off', path: '/icons/database-off.svg', category: 'Data', description: 'Database offline' },
  { name: 'Chart Dots', path: '/icons/chart-dots.svg', category: 'Data', description: 'Data points' },
  { name: 'Chart Line', path: '/icons/chart-line.svg', category: 'Data', description: 'Data trend' },

  // Other
  { name: 'Mail', path: '/icons/mail.svg', category: 'Other', description: 'Email' },
  { name: 'Phone', path: '/icons/phone.svg', category: 'Other', description: 'Phone' },
  { name: 'Hexagon', path: '/icons/hexagon.svg', category: 'Other', description: 'Hexagon shape' },
]

/**
 * Get icons by category
 */
export function getIconsByCategory(category: IconCategory): IconDefinition[] {
  return AVAILABLE_ICONS.filter(icon => icon.category === category)
}

/**
 * Get all icon categories with counts
 */
export function getIconCategoriesWithCounts(): Array<{ category: IconCategory; count: number }> {
  return ICON_CATEGORIES.map(category => ({
    category,
    count: getIconsByCategory(category).length,
  }))
}

/**
 * Search icons by name or description
 */
export function searchIcons(query: string): IconDefinition[] {
  const lowerQuery = query.toLowerCase()
  return AVAILABLE_ICONS.filter(
    icon =>
      icon.name.toLowerCase().includes(lowerQuery) ||
      icon.description.toLowerCase().includes(lowerQuery)
  )
}
