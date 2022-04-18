import { useState } from "react";

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <div>{`You've pressed the button ${count} times!`}</div>
      <button
        onClick={() => {
          setCount((prev) => prev + 1);
        }}
      >
        Press!
      </button>
    </div>
  );
};

export default App;
