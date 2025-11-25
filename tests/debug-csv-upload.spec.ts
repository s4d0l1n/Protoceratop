import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test('debug CSV upload and processing', async ({ page }) => {
  // Capture console logs
  const logs: string[] = []
  page.on('console', msg => {
    const text = msg.text()
    console.log('BROWSER:', text)
    logs.push(text)
  })

  // Capture errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message)
  })

  await page.goto('/')
  await expect(page.locator('h2:has-text("Welcome to RaptorGraph")')).toBeVisible()

  // Open upload panel
  await page.locator('aside nav button').first().click()
  await expect(page.locator('h2:has-text("Upload CSV")')).toBeVisible()

  // Upload CSV
  const filePath = path.join(__dirname, 'fixtures', 'sample-nodes.csv')
  await page.locator('input[type="file"]').setInputFiles(filePath)

  // Wait for file to be uploaded
  await page.waitForTimeout(1000)
  await expect(page.locator('text=sample-nodes.csv').first()).toBeVisible()

  // Click "Configure Mapping" button
  await page.locator('button:has-text("Configure Mapping")').click()

  // Wait for column mapper to appear
  await page.waitForTimeout(1000)
  await expect(page.locator('text=Column Mapping Wizard')).toBeVisible()

  // Take a screenshot of the column mapper
  await page.screenshot({ path: 'test-results/column-mapper.png' })

  // Check if ID column is detected
  const idColumnExists = await page.locator('text="ID"').first().isVisible()
  console.log('ID column visible:', idColumnExists)

  // Click Confirm Mapping button
  const confirmButton = page.locator('button:has-text("Confirm Mapping")')
  await expect(confirmButton).toBeVisible()

  // Check if button is enabled
  const isDisabled = await confirmButton.isDisabled()
  console.log('Confirm button disabled:', isDisabled)

  if (!isDisabled) {
    await confirmButton.click()

    // Wait for processing
    await page.waitForTimeout(3000)

    // Take screenshot after processing
    await page.screenshot({ path: 'test-results/after-processing.png' })

    // Check node count in header
    const nodeCountElement = page.locator('text=/\\d+ Nodes/')
    if (await nodeCountElement.isVisible()) {
      const nodeCountText = await nodeCountElement.textContent()
      console.log('Node count text:', nodeCountText)
    } else {
      console.log('Node count not visible')
    }

    // Check if canvas is visible
    const canvas = page.locator('canvas')
    const canvasVisible = await canvas.isVisible()
    console.log('Canvas visible:', canvasVisible)
  }

  // Print all captured console logs
  console.log('\n=== ALL CONSOLE LOGS ===')
  logs.forEach(log => console.log(log))

  // Wait a bit to see final state
  await page.waitForTimeout(2000)
})
