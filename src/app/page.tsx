'use client'
import React, { useState, useEffect, useCallback, useContext } from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Share2,
  Edit3,
  Wallet,
  Box,
  Globe,
  Twitter,
  Github,
  Instagram,
  Linkedin,
  Check,
  Loader2,
  Save,
  Rocket,
} from 'lucide-react'
import { SendUserOpContext } from '@/contexts/SendUserOpContext'
import { useAccount } from 'wagmi'
import { useEthersSigner } from '@/hooks'
import { ScreenManagerContext } from '@/contexts/ScreenManagerContext'
import { screens } from '@/types'

const CONTRACT_ABI = [
  'function setProfile(string memory _username, string memory _ipfsHash) public',
  'function getProfileByUsername(string memory _username) public view returns (string memory ipfsHash, address user)',
  'function profiles(address user) public view returns (string memory ipfsHash, string memory username)',
]

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS

export default function App() {
  const { address: account, isConnected } = useAccount()
  const signer = useEthersSigner()

  // 1. AMBIL FUNGSI DARI CONTEXT NERO
  const sendOpContext = useContext(SendUserOpContext)
  // TAMBAHKAN BARIS INI
  const screenManager = useContext(ScreenManagerContext)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
const [nfts, setNfts] = useState<any[]>([])
  const [loadingNfts, setLoadingNfts] = useState(false)

const fetchNftsFromChain = useCallback(async (ownerAddress: string) => {
    if (!ownerAddress || ownerAddress === ethers.constants.AddressZero) return
    
    setLoadingNfts(true)
    try {
      const rpcProvider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.nerochain.io')
      
      // 1. MASUKKAN ALAMAT KONTRAK PENUH DARI GAMBAR ANDA DI SINI
      const NFT_CONTRACT_ADDRESS = "0xf425742f182899de2f1efa0b02901d6c47c7ccc6" // Isi lengkapnya (lihat di dompet/explorer)
      
      const NFT_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function name() view returns (string)",
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
      ]
      
      const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, rpcProvider)
      
      // Cek Saldo
      const balance = await contract.balanceOf(ownerAddress)
      if (balance.toNumber() === 0) {
        setNfts([])
        setLoadingNfts(false)
        return
      }

      const collectionName = await contract.name().catch(() => "Nero NFT")
      let tokenIds: string[] = []

      // 2. MENCARI TOKEN ID
      try {
        // Cara A: Pakai Enumerable (Standar lama)
        for(let i = 0; i < balance.toNumber(); i++) {
          const tid = await contract.tokenOfOwnerByIndex(ownerAddress, i)
          tokenIds.push(tid.toString())
        }
      } catch (e) {
        console.log("Mencari via log transfer karena kontrak tidak support Enumerable...")
        // Cara B: Cari dari Riwayat Transfer jika Cara A ditolak kontrak
        const filter = contract.filters.Transfer(null, ownerAddress)
        const logs = await contract.queryFilter(filter, 0, "latest")
        // Ambil token ID unik dari riwayat masuk
        const uniqueTokens = new Set<string>()
        logs.forEach(log => {
          if (log.args && log.args.tokenId) uniqueTokens.add(log.args.tokenId.toString())
        })
        tokenIds = Array.from(uniqueTokens)
      }

      const fetchedNfts = []

      // 3. MEMBACA METADATA JSON & MENCARI GAMBAR
      for (let tokenId of tokenIds) {
        try {
          let uri = await contract.tokenURI(tokenId)
          if (!uri) continue

          // Ubah IPFS menjadi link HTTP yang bisa dibuka browser
          let httpUrl = uri.startsWith('ipfs://') 
            ? uri.replace('ipfs://', import.meta.env.VITE_GATEWAY_URL || 'https://ipfs.io/ipfs/') 
            : uri

          let finalImageUrl = httpUrl
          let finalName = `${collectionName} #${tokenId}`

          // Tarik data JSON untuk mencari gambar aslinya
          try {
            const metaRes = await axios.get(httpUrl)
            if (metaRes.data) {
              if (metaRes.data.name) finalName = metaRes.data.name
              if (metaRes.data.image) {
                finalImageUrl = metaRes.data.image.startsWith('ipfs://')
                  ? metaRes.data.image.replace('ipfs://', import.meta.env.VITE_GATEWAY_URL || 'https://ipfs.io/ipfs/')
                  : metaRes.data.image
              }
            }
          } catch (jsonErr) {
            console.log("URL bukan file JSON, menggunakan URL langsung.")
          }

          fetchedNfts.push({ name: finalName, image_url: finalImageUrl })
        } catch (err) {
          console.error(`Gagal memuat detail token ${tokenId}:`, err)
        }
      }
      
      setNfts(fetchedNfts)
    } catch (e) {
      console.error("Gagal total menarik dari Smart Contract:", e)
      setNfts([])
    }
    setLoadingNfts(false)
  }, [])

  // Panggil fungsi ini di dalam useEffect fetchProfileData
  useEffect(() => {
    const path = window.location.pathname.replace('/', '')
    if (path && path !== '') {
      // Jika orang lain buka link /username, ambil NFT alamat tersebut
      // Anda perlu mendapatkan alamat owner dari fetchProfileData terlebih dahulu
    }
  }, [account])
  const [profile, setProfile] = useState({
    username: '',
    bio: 'NeroChain Explorer',
    x: '',
    linkedin: '',
    instagram: '',
    github: '',
    portfolio: '',
    nftCollection: '',
  })

  // 1. PERBAIKAN FUNGSI FETCH (Gunakan RPC murni, hapus signer)
  const fetchProfileData = useCallback(
    async (identifier: string, isAddress: boolean) => {
      setLoading(true)
      try {
        const rpcProvider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.nerochain.io')
        // Pastikan provider HANYA rpcProvider, jangan gunakan signer untuk membaca
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, rpcProvider)

        let ipfsHash = ''
        let ownerAddr = ''

        if (isAddress) {
          const data = await contract.profiles(identifier)
          ipfsHash = data.ipfsHash
          ownerAddr = identifier
        } else {
          const data = await contract.getProfileByUsername(identifier)
          ipfsHash = data.ipfsHash
          ownerAddr = data.user
        }

if (ipfsHash) {
          const res = await axios.get(`${import.meta.env.VITE_GATEWAY_URL}${ipfsHash}`)
          setProfile(res.data)
          
          // Memicu pencarian NFT Real-Time langsung dari Smart Contract
          fetchNftsFromChain(ownerAddr)

          if (account && ownerAddr.toLowerCase() === account.toLowerCase()) {
            setIsOwner(true)
          } else {
            setIsOwner(false)
          }
        }
      } catch (e) {
        console.log('Profil tidak ditemukan')
      }
      setLoading(false)
    },
    // HAPUS signer dan isConnected dari sini untuk mencegah infinite loop
    [account],
  )

  // 2. TAMBAHKAN KEMBALI USE EFFECT INI (Sebelumnya tidak sengaja terhapus)
  // Ini bertugas memanggil fetchProfileData saat halaman dibuka
  useEffect(() => {
    const path = window.location.pathname.replace('/', '')

    if (path && path !== 'index.html' && path !== '') {
      fetchProfileData(path, false)
    } else if (account) {
      fetchProfileData(account, true)
    } else {
      setLoading(false)
    }
  }, [account, fetchProfileData])

  // 2. PANTAU STATUS TRANSAKSI DARI SIDEBAR NERO
  // Karena transaksi dieksekusi oleh Sidebar, kita harus memantau hasilnya dari Context
  useEffect(() => {
    if (sendOpContext?.latestUserOpResult) {
      console.log('Transaksi sukses dari Sidebar!', sendOpContext.latestUserOpResult)
      alert('Sukses! Profil berhasil disimpan via Nero Wallet.')
      setIsEditing(false)
      fetchProfileData(profile.username, false) // Refresh data
      // Bersihkan hasil agar tidak trigger terus-menerus
      sendOpContext.setLatestUserOpResult(null)
    }
  }, [sendOpContext?.latestUserOpResult])

  const saveProfile = async () => {
    if (!account) return alert('Koneksikan dompet!')

    setLoading(true)
    try {
      // 1. Proses IPFS (tetap sama)
      const pinRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', profile, {
        headers: {
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      })
      const ipfsHash = pinRes.data.IpfsHash

      // 2. Persiapkan Calldata (tetap sama)
      const iface = new ethers.utils.Interface(CONTRACT_ABI)
      const calldata = iface.encodeFunctionData('setProfile', [profile.username, ipfsHash])

      // 3. TRIGGER SIDEBAR NERO (SESUAIKAN DENGAN useSendUserOp)
      if (sendOpContext && screenManager) {
        console.log('Mengirim transaksi ke Sidebar Nero...')

        // JANGAN gunakan calldata di sini, SDK Nero ingin merakitnya sendiri
        sendOpContext.setUserOperations([
          {
            // --- DATA UNTUK MESIN BLOCKCHAIN (useSendUserOp.ts) ---
            contractAddress: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI, // Kirimkan ABI lengkapnya
            function: 'setProfile', // Nama fungsinya saja
            params: [profile.username, ipfsHash], // Kirim parameter dalam array
            value: '0',

            // --- DATA UNTUK VISUAL UI (SendUserOpDetail.tsx) ---
            // (Tetap masukkan agar UI tidak crash truncateAddress)
            to: CONTRACT_ADDRESS,
          } as any,
        ])

        // Buka Panel dan Navigasi
        sendOpContext.forceOpenPanel()

        setTimeout(() => {
          screenManager.navigateTo(screens.SENDUSEROP)
        }, 300)
      } else {
        alert('Nero Context tidak ditemukan!')
      }
    } catch (e) {
      console.error(e)
      alert('Terjadi kesalahan!')
    }
    setLoading(false)
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${profile.username}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className='min-h-screen bg-black text-white p-4 md:p-8 font-sans selection:bg-purple-500'>
      <div className='fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(17,24,39,1)_0%,_rgba(0,0,0,1)_100%)] -z-10' />

      <div className='max-w-5xl mx-auto'>
        <nav className='flex justify-between items-center mb-8 p-4 bg-white/5 backdrop-blur-xl rounded-full border border-white/10'>
          <div className='flex items-center gap-2'>
            <img src='/nero-logo-2.png' className='h-8' alt='Nero Logo' />
            <span className='font-bold tracking-tighter text-xl uppercase'>Nero Profile</span>
          </div>

          <div className='flex gap-3'>
            {profile.username && (
              <button
                onClick={handleShare}
                className='p-2 bg-white/5 rounded-full hover:bg-white/10 border border-white/5'
              >
                {copied ? <Check size={20} className='text-green-400' /> : <Share2 size={20} />}
              </button>
            )}

            {/* Tombol Simpan/Edit kini akan selalu muncul jika user terkoneksi untuk mencegah bug hilang */}
            {isConnected && (
              <button
                onClick={() => (isEditing ? saveProfile() : setIsEditing(true))}
                className='px-6 py-2 bg-white text-black rounded-full font-bold hover:scale-105 transition-all flex items-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]'
              >
                {loading ? (
                  <Loader2 className='animate-spin' size={18} />
                ) : isEditing ? (
                  <Save size={18} />
                ) : (
                  <Edit3 size={18} />
                )}
                {isEditing
                  ? 'Simpan Gasless (AA)'
                  : profile.username
                    ? 'Edit Profil'
                    : 'Klaim Username'}
              </button>
            )}
          </div>
        </nav>

        {/* Indikator Akun Baru yang Lebih Akurat */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mb-6 p-4 rounded-2xl border bg-purple-500/10 border-purple-500/30 flex items-center justify-between'
          >
            <div className='flex items-center gap-3'>
              <div className='p-2 rounded-full bg-purple-500'>
                <Wallet size={16} className='text-black' />
              </div>
              <div>
                <p className='text-[10px] font-bold uppercase tracking-widest opacity-60'>
                  Connected Address
                </p>
                <p className='text-sm font-bold text-purple-400 font-mono'>{account}</p>
              </div>
            </div>
            <span className='text-[10px] text-purple-300/70 italic text-right max-w-[200px]'>
              Pastikan Anda login via Twitter/Google di Sidebar agar transaksi masuk ke Dashboard
              AA.
            </span>
          </motion.div>
        )}

        {loading ? (
          <div className='flex flex-col justify-center items-center py-40 gap-4'>
            <Loader2 className='animate-spin text-purple-500' size={48} />
            <p className='text-gray-500 animate-pulse text-sm font-mono'>
              Syncing with NeroChain...
            </p>
          </div>
        ) : window.location.pathname === '/' && !profile.username && !isEditing ? (
          /* LANDING PAGE */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className='flex flex-col items-center justify-center py-24 text-center'
          >
            <div className='mb-6 p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 w-fit'>
              <Rocket className='text-purple-500' size={32} />
            </div>
            <h1 className='text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-neutral-600 bg-clip-text text-transparent'>
              On-Chain Identity.
            </h1>
            <p className='text-gray-400 max-w-lg mb-12 text-lg leading-relaxed'>
              Klaim username unik Anda di NeroChain. Profil ini sepenuhnya terdesentralisasi
              menggunakan Account Abstraction & IPFS.
            </p>
            {!isConnected ? (
              <div className='p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm'>
                <p className='text-sm text-purple-400 font-mono animate-pulse'>
                  Buka Sidebar Nero di kanan untuk masuk →
                </p>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className='px-10 py-5 bg-purple-600 text-white rounded-full font-bold text-xl hover:bg-purple-500 transition-all shadow-[0_0_40px_rgba(168,85,247,0.3)]'
              >
                Klaim Username Anda
              </button>
            )}
          </motion.div>
        ) : (
          /* BENTO GRID */
          <div className='flex flex-col gap-4'>
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className='bg-neutral-900/60 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-md mb-4'
                >
                  <label className='text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em] mb-3 block px-1'>
                    Pilih Username Anda
                  </label>
                  <div className='flex items-center bg-black/40 rounded-2xl px-4 border border-white/5 focus-within:border-purple-500/50 transition-all'>
                    <span className='text-gray-600 text-sm font-mono'>neroprofile.xyz/</span>
                    <input
                      type='text'
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                        })
                      }
                      placeholder='username'
                      className='bg-transparent border-none focus:ring-0 text-white w-full py-4 pl-1 font-mono text-lg outline-none'
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <motion.div
                layout
                className='md:col-span-3 p-10 rounded-[3rem] bg-neutral-900/40 border border-white/10 backdrop-blur-md min-h-[300px] flex flex-col justify-between'
              >
                <div>
                  <span className='text-purple-400 font-mono text-xs tracking-widest uppercase'>
                    Professional Bio
                  </span>
                  {isEditing ? (
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className='w-full bg-transparent text-4xl font-bold mt-6 outline-none border-b border-white/5 py-2 h-40 resize-none'
                      placeholder='Ceritakan tentang diri Anda...'
                    />
                  ) : (
                    <h1 className='text-4xl md:text-6xl font-bold mt-6 leading-tight tracking-tighter'>
                      {profile.bio}
                    </h1>
                  )}
                </div>
                <div className='mt-8 flex items-center gap-4'>
                  <div className='px-5 py-2 bg-white/5 rounded-full text-xs font-mono border border-white/5 text-gray-400'>
                    {`neroprofile.xyz/${profile.username || 'unknown'}`}
                  </div>
                  <div className='text-[10px] text-gray-700 font-mono truncate max-w-[150px]'>
                    {account}
                  </div>
                </div>
              </motion.div>

              <SocialCard
                icon={Twitter}
                label='X'
                value={profile.x}
                type='x'
                profile={profile}
                setProfile={setProfile}
                isEditing={isEditing}
              />
              <SocialCard
                icon={Instagram}
                label='Instagram'
                value={profile.instagram}
                type='instagram'
                profile={profile}
                setProfile={setProfile}
                isEditing={isEditing}
              />

              <motion.div
                whileHover={{ y: -5 }}
                className='md:col-span-2 p-10 rounded-[3rem] bg-gradient-to-br from-neutral-900 to-black border border-white/10 flex flex-col justify-between group overflow-hidden relative min-h-[220px]'
              >
                <div className='absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all rotate-12'>
                  <Box size={100} className='text-white' />
                </div>

                <div>
                  <h3 className='text-3xl font-bold mb-3'>NFT Assets</h3>
                  <p className='text-gray-500 text-sm'>
                    Koleksi aset digital milik @{profile.username || 'user'}
                  </p>
                </div>

                {/* Galeri NFT Publik yang bisa dilihat orang lain */}
                <div className='flex gap-4 mt-6 overflow-x-auto pb-4 scrollbar-hide'>
                  {loadingNfts ? (
                    <div className='flex items-center gap-2 text-gray-500 text-xs'>
                      <Loader2 className='animate-spin' size={14} /> Scanning NeroChain...
                    </div>
                  ) : nfts.length > 0 ? (
                    nfts.map((nft, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='flex-shrink-0'
                      >
                        <img
                          src={
                            nft.image_url ||
                            nft.token?.image_url ||
                            'https://placehold.co/200x200?text=NFT'
                          }
                          className='h-24 w-24 rounded-2xl object-cover border border-white/10'
                          alt={nft.name}
                        />
                        <p className='text-[8px] text-gray-500 mt-2 text-center truncate w-24'>
                          {nft.name || 'Unnamed NFT'}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <p className='text-xs text-gray-600 italic'>Tidak ada NFT di dompet ini.</p>
                  )}
                </div>

                {isOwner && (
                  <button
                    onClick={() => {
                      sendOpContext?.forceOpenPanel()
                      screenManager?.navigateTo(screens.NFT)
                    }}
                    className='w-fit mt-8 px-8 py-3 bg-white text-black rounded-full text-xs font-bold transition-all z-10'
                  >
                    Kelola NFT Saya →
                  </button>
                )}
              </motion.div>

              <SocialCard
                icon={Github}
                label='Github'
                value={profile.github}
                type='github'
                profile={profile}
                setProfile={setProfile}
                isEditing={isEditing}
              />
              <SocialCard
                icon={Linkedin}
                label='LinkedIn'
                value={profile.linkedin}
                type='linkedin'
                profile={profile}
                setProfile={setProfile}
                isEditing={isEditing}
              />
              <SocialCard
                icon={Globe}
                label='Website'
                value={profile.portfolio}
                type='portfolio'
                profile={profile}
                setProfile={setProfile}
                isEditing={isEditing}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

const SocialCard = ({ icon: Icon, label, value, type, isEditing, profile, setProfile }: any) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -5 }}
    className='p-8 rounded-[2.5rem] bg-neutral-900/40 border border-white/10 flex flex-col items-center justify-center gap-4 text-center min-h-[180px] backdrop-blur-sm relative'
  >
    <div className='p-3 bg-white/5 rounded-2xl group-hover:bg-purple-500/20 transition-all'>
      <Icon size={32} className='text-white' />
    </div>
    {isEditing ? (
      <input
        placeholder={`URL ${label}`}
        value={value}
        onChange={(e) => setProfile({ ...profile, [type]: e.target.value })}
        className='w-full bg-white/5 rounded-xl px-3 py-2 text-[10px] border border-white/10 outline-none text-center text-white focus:border-purple-500'
      />
    ) : (
      <a
        href={value && value.startsWith('http') ? value : `https://${value}`}
        target='_blank'
        rel='noopener noreferrer'
        className='text-[10px] font-black text-gray-500 tracking-[0.3em] uppercase hover:text-purple-400 transition-all'
      >
        {label}
      </a>
    )}
  </motion.div>
)
