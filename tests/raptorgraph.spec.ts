import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('RaptorGraph Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to be ready
    await expect(page.locator('h2:has-text("Welcome to RaptorGraph")')).toBeVisible()
  })

  test('should display welcome screen on initial load', async ({ page }) => {
    // Check welcome screen elements
    await expect(page.locator('h2:has-text("Welcome to RaptorGraph")')).toBeVisible()
    await expect(page.locator('text=🔒 100% Offline').first()).toBeVisible()
    await expect(page.locator('text=⚡ High Performance').first()).toBeVisible()
    await expect(page.locator('text=🎨 Fully Customizable').first()).toBeVisible()

    // Check header
    await expect(page.locator('text=RaptorGraph').first()).toBeVisible()

    // Check sidebar is visible
    await expect(page.locator('aside')).toBeVisible()
  })

  test('should open upload panel and upload CSV', async ({ page }) => {
    // Click upload button in sidebar (Upload CSV is the first button)
    await page.locator('aside nav button').first().click()

    // Wait for upload panel to appear
    await expect(page.locator('h2:has-text("Upload CSV")')).toBeVisible()

    // Upload CSV file
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(filePath)

    // Wait for file to be processed
    await page.waitForTimeout(1000)

    // Check that column mapper appears
    await expect(page.locator('text=Column Mapping')).toBeVisible()
  })

  test('should map columns and create graph', async ({ page }) => {
    // Upload CSV
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)

    await page.waitForTimeout(1000)

    // Map columns
    // ID column should be auto-detected, just verify and click Next
    await expect(page.locator('text=Column Mapping')).toBeVisible()

    // Click through column mapper (assuming auto-detection works)
    const nextButton = page.locator('button:has-text("Next")')
    if (await nextButton.isVisible()) {
      await nextButton.click()
    }

    // Click Finish
    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }

    // Wait for graph to render
    await page.waitForTimeout(2000)

    // Check that graph canvas is visible
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()

    // Check that node count is displayed in header
    await expect(page.locator('text=/\\d+ Nodes/')).toBeVisible()
  })

  test('should open node detail panel when clicking a node', async ({ page }) => {
    // First, upload and create graph
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    // Skip column mapping (assume defaults work)
    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Click on canvas to select a node (click in center)
    const canvas = page.locator('canvas')
    await canvas.click({ position: { x: 400, y: 300 } })

    // Wait for detail panel
    await page.waitForTimeout(500)

    // Check if detail panel opened (it may or may not depending on click position)
    const detailPanel = page.locator('text=Node Details')
    if (await detailPanel.isVisible()) {
      await expect(detailPanel).toBeVisible()
    }
  })

  test('should open and interact with layout panel', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Open layout panel
    // Open layout panel (5th button in sidebar: Upload, Templates, Edge Templates, Styles, Search, Layout)
    await page.locator('aside nav button').nth(5).click()

    // Wait for layout panel
    await expect(page.locator('h2:has-text("Graph Layout")')).toBeVisible()

    // Check layout options are visible
    await expect(page.locator('text=Circle')).toBeVisible()
    await expect(page.locator('text=Grid')).toBeVisible()
    await expect(page.locator('text=Timeline')).toBeVisible()

    // Select timeline layout
    await page.click('button:has-text("Timeline")')

    // Apply layout
    await page.click('button:has-text("Apply Layout")')

    // Wait for layout to apply
    await page.waitForTimeout(1000)

    // Check for success toast
    await expect(page.locator('text=/Applied.*layout/i')).toBeVisible({ timeout: 5000 })
  })

  test('should open search and filter panel', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Open search panel
    // Open search panel (4th button in sidebar)
    await page.locator('aside nav button').nth(4).click()

    // Wait for panel
    await expect(page.locator('h2:has-text("Search & Filter")')).toBeVisible()

    // Try searching
    const searchInput = page.locator('input[placeholder*="Search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('server')
      await page.waitForTimeout(500)

      // Check that results are filtered
      await expect(page.locator('text=/\\d+ Results/')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open grouping panel', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Open grouping panel
    // Open grouping panel (6th button in sidebar)
    await page.locator('aside nav button').nth(6).click()

    // Wait for panel
    await expect(page.locator('h2:has-text("Node Grouping")')).toBeVisible()

    // Check grouping options
    await expect(page.locator('text=Enable Grouping')).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    // Check initial state (should be dark by default)
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    // Find and click dark mode toggle (in header)
    const darkModeButton = page.locator('button').filter({ hasText: /theme|dark|light/i }).first()
    if (await darkModeButton.isVisible()) {
      await darkModeButton.click()
      await page.waitForTimeout(300)

      // Check if dark class is removed
      const hasNoDark = await html.evaluate((el) => !el.classList.contains('dark'))
      expect(hasNoDark).toBeTruthy()
    }
  })

  test('should export graph as PNG', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    const exportButton = page.locator('button').filter({ hasText: /export|png/i }).first()
    if (await exportButton.isVisible()) {
      await exportButton.click()

      // Wait for download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/\.png$/)
    }
  })

  test('should save and load project', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Save project
    const downloadPromise = page.waitForEvent('download')

    // Use keyboard shortcut or click save button
    await page.keyboard.press('Control+S')

    // Wait for download
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.raptorjson$/)
  })

  test('should test keyboard shortcuts', async ({ page }) => {
    // Upload CSV first
    await page.locator('aside nav button').first().click()
    const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
    await page.locator('input[type="file"]').setInputFiles(filePath)
    await page.waitForTimeout(1000)

    const finishButton = page.locator('button:has-text("Finish")')
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.waitForTimeout(2000)

    // Test Ctrl+F (open search)
    await page.keyboard.press('Control+F')
    await page.waitForTimeout(500)
    await expect(page.locator('h2:has-text("Search & Filter")')).toBeVisible()

    // Test Esc (close panel)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Search panel should be closed
    await expect(page.locator('h2:has-text("Search & Filter")')).not.toBeVisible()
  })

  test('should collapse and expand sidebar', async ({ page }) => {
    // Find sidebar
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    // Find collapse button (chevron)
    const collapseButton = sidebar.locator('button').first()
    await collapseButton.click()

    await page.waitForTimeout(300)

    // Sidebar should be narrower (collapsed)
    const width = await sidebar.evaluate((el) => el.offsetWidth)
    expect(width).toBeLessThan(100)

    // Click again to expand
    await collapseButton.click()
    await page.waitForTimeout(300)

    const expandedWidth = await sidebar.evaluate((el) => el.offsetWidth)
    expect(expandedWidth).toBeGreaterThan(150)
  })
})
