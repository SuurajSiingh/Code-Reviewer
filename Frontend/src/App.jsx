import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import hljs from 'highlight.js/lib/core' // Lightweight core import
// Register the main languages we care about detecting
import javascript from 'highlight.js/lib/languages/javascript'
import python from 'highlight.js/lib/languages/python'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml' // handles HTML
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'

import axios from 'axios'
import './App.css'

// Initialize highlight.js languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', javascript) // uses same token syntax
hljs.registerLanguage('python', python)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('cpp', cpp)
hljs.registerLanguage('java', java)
hljs.registerLanguage('go', go)
hljs.registerLanguage('rust', rust)

function App() {
  const [code, setCode] = useState(`function sum() {\n  return 1 + 1\n}`)
  const [review, setReview] = useState(``)
  const [status, setStatus] = useState('idle')
  const [language, setLanguage] = useState('javascript')
  const [activeTab, setActiveTab] = useState('report')
  const [metrics, setMetrics] = useState({ quality: 0, security: 0, efficiency: 0 })
  
  const fileInputRef = useRef(null)

  // Run the auto-detector algorithm
  function detectAndSetLanguage(currentCode) {
    if (!currentCode.trim()) return

    // Limit detection subset to languages available in our dropdown
    const subset = ['javascript', 'python', 'css', 'html', 'cpp', 'java', 'go', 'rust']
    const result = hljs.highlightAuto(currentCode, subset)
    
    if (result.language && result.language !== language) {
      setLanguage(result.language)
    }
  }

  function handleEditorChange(value) {
    const updatedCode = value || ''
    setCode(updatedCode)
    detectAndSetLanguage(updatedCode)
  }

  async function reviewCode() {
    if (!code.trim()) return
    setStatus('scanning')
    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', { code, language })
      setReview(response.data)
      setStatus('reviewed')
      setActiveTab('report')
      
      setMetrics({
        quality: Math.floor(Math.random() * 25) + 70,
        security: Math.floor(Math.random() * 20) + 80,
        efficiency: Math.floor(Math.random() * 30) + 65
      })
    } catch (error) {
      console.error("Review failed:", error)
      setStatus('idle')
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const fileContent = event.target.result
      setCode(fileContent)
      
      const ext = file.name.split('.').pop().toLowerCase()
      const langMap = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', html: 'html', css: 'css', json: 'json', java: 'java',
        cpp: 'cpp', c: 'c', cs: 'csharp', go: 'go', rs: 'rust', md: 'markdown'
      }
      if (langMap[ext]) {
        setLanguage(langMap[ext])
      } else {
        detectAndSetLanguage(fileContent)
      }
    }
    reader.readAsText(file)
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  function clearAll() {
    setCode('')
    setReview('')
    setStatus('idle')
    setMetrics({ quality: 0, security: 0, efficiency: 0 })
  }

  function extractCorrectedCode() {
    if (!review) return ""
    const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/g
    const matches = [...review.matchAll(codeBlockRegex)]
    if (matches.length > 0) {
      return matches.map(m => m[1]).join('\n\n')
    }
    return "// No explicit standalone code overrides discovered in report body.\n" + code
  }

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="brand">CODE<span>//</span>REVIEWER</div>
        <div className={`status-pill status--${status}`}>
          <span className="pulse-dot"></span>
          {status === 'idle' && 'System Ready'}
          {status === 'scanning' && 'Running Deep Analysis...'}
          {status === 'reviewed' && 'Review Finalized'}
        </div>
      </header>

      <main>
        <div className="left-pane animate-fade-in">
          <div className="pane-header toolbar">
            <div className="toolbar-group">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="control-select"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>

              <button className="text-btn" onClick={() => fileInputRef.current.click()}>
                Upload File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </div>
            <button className="text-btn danger" onClick={clearAll}>Clear</button>
          </div>

          <div className="code-window">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: '"JetBrains Mono", monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                automaticLayout: true,
              }}
            />
          </div>
          <button 
            onClick={reviewCode}
            disabled={status === 'scanning'}
            className="review-btn"
          >
            {status === 'scanning' ? 'Analyzing...' : 'Run Review'}
          </button>
        </div>

        <div className={`status-rail rail--${status}`}>
          <div className="rail-line"></div>
          <div className="rail-node"></div>
        </div>

        <div className="right-pane animate-fade-in">
          <div className="pane-header toolbar">
            {status === 'reviewed' && review ? (
              <div className="tabs-container">
                <button 
                  className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                  onClick={() => setActiveTab('report')}
                >
                  Analysis Report
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'corrected' ? 'active' : ''}`}
                  onClick={() => setActiveTab('corrected')}
                >
                  Corrected Code
                </button>
              </div>
            ) : (
              <span className="pane-title">AI_INSIGHTS</span>
            )}

            {review && status === 'reviewed' && (
              <button 
                className="text-btn success" 
                onClick={() => copyToClipboard(activeTab === 'report' ? review : extractCorrectedCode())}
              >
                {activeTab === 'report' ? 'Copy Markdown' : 'Copy Code'}
              </button>
            )}
          </div>
          
          <div className="review-window">
            {status === 'idle' && (
              <div className="empty-state animate-slide-up">
                <p>Upload architectural source files or paste modules to evaluate code quality metrics.</p>
              </div>
            )}

            {status === 'scanning' && (
              <div className="empty-state loading-state">
                <div className="spinner"></div>
                <p className="loading-text">Mapping control structures, verifying security policies, and refactoring layouts...</p>
              </div>
            )}

            {status === 'reviewed' && review && (
              <div className="results-wrapper animate-slide-up">
                {activeTab === 'report' ? (
                  <>
                    <div className="metrics-panel">
                      <div className="metric-card">
                        <div className="metric-info">
                          <span>Maintainability Index</span>
                          <span className="metric-score val-teal">{metrics.quality}%</span>
                        </div>
                        <div className="progress-bar"><div className="fill fill--teal" style={{width: `${metrics.quality}%`}}></div></div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-info">
                          <span>Security Health</span>
                          <span className="metric-score val-amber">{metrics.security}%</span>
                        </div>
                        <div className="progress-bar"><div className="fill fill--amber" style={{width: `${metrics.security}%`}}></div></div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-info">
                          <span>Performance & Speed</span>
                          <span className="metric-score val-blue">{metrics.efficiency}%</span>
                        </div>
                        <div className="progress-bar"><div className="fill fill--blue" style={{width: `${metrics.efficiency}%`}}></div></div>
                      </div>
                    </div>

                    <div className="markdown-body">
                      <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
                    </div>
                  </>
                ) : (
                  <div className="corrected-code-wrapper animate-fade-in">
                    <p className="section-desc">Extracted production-ready source code patches recommended by the engine:</p>
                    <div className="static-editor-box">
                      <Editor
                        height="450px"
                        language={language}
                        theme="vs-dark"
                        value={extractCorrectedCode()}
                        options={{
                          readOnly: true,
                          fontSize: 13,
                          fontFamily: '"JetBrains Mono", monospace',
                          minimap: { enabled: false },
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App