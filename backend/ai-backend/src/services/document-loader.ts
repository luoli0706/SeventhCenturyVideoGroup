import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { StoredChunk } from '../types/index.js'

export class DocumentLoader {
  /**
   * Load all markdown files from the knowledge base directory.
   * Returns file info: path, content, title, and hash.
   */
  loadFiles(basePath: string): { filePath: string; content: string; title: string; hash: string }[] {
    if (!fs.existsSync(basePath)) {
      console.warn(`Knowledge base path does not exist: ${basePath}`)
      return []
    }

    const entries = fs.readdirSync(basePath, { withFileTypes: true })
    const mdFiles = entries
      .filter(e => e.isFile() && e.name.endsWith('.md'))
      .sort((a, b) => a.name.localeCompare(b.name))

    const result: { filePath: string; content: string; title: string; hash: string }[] = []

    for (const entry of mdFiles) {
      const fullPath = path.join(basePath, entry.name)
      const content = fs.readFileSync(fullPath, 'utf-8')
      const hash = crypto.createHash('md5').update(content).digest('hex')
      const title = this.extractTitle(content, entry.name)
      result.push({ filePath: fullPath, content, title, hash })
    }

    console.log(`Loaded ${result.length} markdown files from ${basePath}`)
    return result
  }

  /**
   * Extract document title from frontmatter or first H1.
   */
  private extractTitle(content: string, fileName: string): string {
    // Try to extract title from "# Title" pattern (first H1)
    const h1Match = content.match(/^#\s+(.+)/m)
    if (h1Match) return h1Match[1].trim()

    // Try frontmatter title
    const fmMatch = content.match(/^---\s*\n[\s\S]*?\ntitle:\s*(.+)\n[\s\S]*?\n---/)
    if (fmMatch) return fmMatch[1].trim()

    // Fall back to file name without extension
    return fileName.replace(/\.md$/, '')
  }

  /**
   * Extract category/document type from content metadata.
   */
  extractCategory(content: string): string {
    const tagsMatch = content.match(/^---\s*\n[\s\S]*?\ntags:\s*(.+)\n[\s\S]*?\n---/m)
    if (tagsMatch) return tagsMatch[1].trim()
    return 'general'
  }

  /**
   * Split document content into chunks by headers.
   * Strategy: split by ## headers, keep the header hierarchy context.
   */
  splitIntoChunks(content: string): { header: string; text: string }[] {
    const lines = content.split('\n')
    const chunks: { header: string; text: string }[] = []

    let currentH1 = ''
    let currentH2 = ''
    let currentLines: string[] = []
    let currentHeader = ''

    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)/)
      const h2Match = line.match(/^##\s+(.+)/)
      const h3Match = line.match(/^###\s+(.+)/)

      if (h1Match) {
        // Flush previous chunk
        if (currentLines.length > 0 && currentHeader) {
          chunks.push({ header: currentHeader, text: currentLines.join('\n').trim() })
        }
        currentH1 = h1Match[1].trim()
        currentH2 = ''
        currentLines = [line]
        currentHeader = currentH1
      } else if (h2Match) {
        if (currentLines.length > 0 && currentHeader) {
          chunks.push({ header: currentHeader, text: currentLines.join('\n').trim() })
        }
        currentH2 = h2Match[1].trim()
        currentLines = [line]
        currentHeader = currentH2
      } else if (h3Match) {
        if (currentLines.length > 0 && currentHeader) {
          chunks.push({ header: currentHeader, text: currentLines.join('\n').trim() })
        }
        currentLines = [line]
        currentHeader = h3Match[1].trim()
      } else {
        currentLines.push(line)
      }
    }

    // Last chunk
    if (currentLines.length > 0 && currentHeader) {
      chunks.push({ header: currentHeader, text: currentLines.join('\n').trim() })
    }

    return chunks
  }

  /**
   * Process all files: load, split, and return chunks.
   */
  processAll(basePath: string): StoredChunk[] {
    const files = this.loadFiles(basePath)
    const allChunks: StoredChunk[] = []

    for (const file of files) {
      // Skip metadata/frontmatter only sections
      const body = this.stripFrontmatter(file.content)
      const chunks = this.splitIntoChunks(body)
      const category = this.extractCategory(file.content)

      chunks.forEach((chunk, idx) => {
        // Skip very small chunks (just headers or empty)
        if (chunk.text.replace(/#{1,3}\s+.*/g, '').trim().length < 5) return

        allChunks.push({
          id: `${file.hash}-${idx}`,
          documentId: file.hash,
          documentTitle: file.title,
          documentSource: path.basename(file.filePath),
          content: chunk.text,
          category,
          index: idx,
        })
      })
    }

    console.log(`Generated ${allChunks.length} chunks from ${files.length} files`)
    return allChunks
  }

  /**
   * Strip YAML frontmatter from content.
   */
  private stripFrontmatter(content: string): string {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '')
  }

  /**
   * Compute MD5 hash of concatenated file contents.
   */
  computeHash(files: { content: string }[]): string {
    const combined = files.map(f => f.content).join('')
    return crypto.createHash('md5').update(combined).digest('hex')
  }
}
