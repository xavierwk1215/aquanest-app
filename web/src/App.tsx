import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import { CompatPage } from './pages/CompatPage';
import { DexPage } from './pages/DexPage';
import { MyTankPage } from './pages/MyTankPage';
import { TankBuilderPage } from './pages/TankBuilderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DexPage />} />
          <Route path="compat" element={<CompatPage />} />
          <Route path="tank-builder" element={<TankBuilderPage />} />
          <Route path="my-tanks" element={<MyTankPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
