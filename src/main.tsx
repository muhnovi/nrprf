import ReactDOM from 'react-dom/client'
import neroConfig from '../nerowallet.config'
import { SocialWallet } from './index'
import '@rainbow-me/rainbowkit/styles.css'
import '@/index.css'
import App from './app/page'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SocialWallet config={neroConfig} mode='sidebar'>
    <App />
  </SocialWallet>,
)
