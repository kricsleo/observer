import './App.css';
import { useObserver, useObserverRoot } from "@kricsleo/observer-react";
import { useMemo } from 'react';
import { useState } from 'react';

function App() {
  const [rootEl, setRootEl] = useState();
  const [childEl, setChildEl] = useState();
  const rootOptions = useMemo(() => ({ root: rootEl, timeout: 2000 }), [rootEl]);
  const rootOptions2 = useMemo(() => ({ root: rootEl }), [rootEl]);
  const childOptions = useMemo(() => ({
    enter: () => console.log('entered'),
    active: () => console.log('actived'),
    leave: () => console.log('leaved'),
  }));
  const childOptions2 = useMemo(() => ({
    enter: () => console.log('entered2'),
    active: () => console.log('actived2'),
    leave: () => console.log('leaved2'),
  }));
  useObserverRoot('key1', rootOptions);
  useObserverRoot('key2', rootOptions2);
  useObserver('key1', childEl, childOptions);
  useObserver('key2', childEl, childOptions2);
  return (
    <div className="App">
      <h3 className="title">单次曝光</h3>
      <section className="wrapper" ref={el => el && setRootEl(el)}>
        <div className="holder"></div>
        <div className="box" ref={el => el && setChildEl(el)}></div>
        <div className="holder"></div>
      </section>
    </div>
  );
}

export default App;
