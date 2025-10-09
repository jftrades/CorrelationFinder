import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>hallo dulli</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <Counter first={1}></Counter>
        <Counter></Counter>
        <Header1 hund="hallo">jhjgjkughju</Header1>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}
export default App


function Counter(props) {
  const [count, setCount] = useState(props.first)
  function add() {
    setCount(count + 1)
  }
  return <button onClick={add}>{count}</button>
}

function Header1(props) {
  console.log(props)
  return <h2>{props.esel}</h2>
}