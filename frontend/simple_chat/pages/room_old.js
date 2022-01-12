// import Head from 'next/head';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import React, { useState, useEffect } from 'react';
// import { userState, socketState } from '../components/atoms';
// import { useRecoilState } from 'recoil';
// import Image from 'next/image';

// export default function Room(pageProps) {
//   const router = useRouter();
//   console.log(router);
//   const [user, setUser] = useRecoilState(userState);
//   const [socket, setSocket] = useRecoilState(socketState);
//   const [message, setMessage] = useState('');
//   const [isShowMenuContent, setIsShowMenuContent] = useState(true);
//   const [rooms, setRooms] = useState([
//     {
//       name: 'test1',
//       icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
//       num_unread: 3,
//       last_update: new Date(),
//       last_message: 'やあ！',
//     },
//     {
//       name: 'test2',
//       icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
//       num_unread: 0,
//       last_update: new Date(),
//       last_message: 'やあ！',
//     },
//     {
//       name: 'test3',
//       icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
//       num_unread: 1,
//       last_update: new Date(),
//       last_message: 'やあ！',
//     },
//     {
//       name: 'test4',
//       icon: 'https://icooon-mono.com/i/icon_11324/icon_113241_48.png',
//       num_unread: 3,
//       last_update: new Date(),
//       last_message: 'やあ！',
//     },
//   ]);
//   useEffect(() => {
//     if (window.innerWidth >= 672) {
//       setIsShowMenuContent(true);
//     } else {
//       setIsShowMenuContent(false);
//     }
//   }, []);

//   const handleMessageChange = (e) => {
//     setMessage(e.target.value);
//   };

//   const handleSendBtnClick = async (e) => {
//     let json_data = {
//       message,
//       command: '1',
//       user_id: user.ID,
//     };
//     socket.send(JSON.stringify(json_data));
//     // const res = await fetch('http://localhost:1323/send', {
//     //   method: 'POST',
//     //   headers: {
//     //     'Content-Type': 'application/json',
//     //   },
//     //   body: JSON.stringify({
//     //     id: user.ID,
//     //     message,
//     //   }),
//     // }).catch(() => null);
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen w-screen">
//       <Head>
//         <title>部屋一覧</title>
//       </Head>

//       <nav className="flex items-center justify-between w-full max-w-screen-lg flex-wrap bg-slate-400 p-4">
//         <div className="flex items-center flex-no-shrink text-white mr-6">
//           <span className="font-semibold text-xl tracking-tight">部屋一覧</span>
//         </div>
//         <div className="block lg:hidden">
//           <button
//             className="flex items-center px-3 py-2 border rounded text-teal-lighter border-teal-light hover:text-white hover:border-white"
//             onClick={() => {
//               setIsShowMenuContent(!isShowMenuContent);
//             }}
//           >
//             <svg
//               className="h-3 w-3 fill-white"
//               viewBox="0 0 20 20"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <title>Menu</title>
//               <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
//             </svg>
//           </button>
//         </div>
//         <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto">
//           {isShowMenuContent && (
//             <div className="animate-fade-in-down">
//               <div className="text-sm lg:flex-grow">
//                 <a
//                   href="#responsive-header"
//                   className="block mt-4 lg:inline-block lg:mt-0 text-teal-lighter hover:text-white mr-4"
//                 >
//                   友達一覧
//                 </a>
//               </div>
//               <div>
//                 <a
//                   href="#"
//                   className="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal hover:bg-white mt-4 lg:mt-0"
//                 >
//                   Logout
//                 </a>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       <main className="flex flex-col items-center justify-start w-full flex-1 container bg-zinc-100">
//         {rooms.map((room) => {
//           return (
//             <button className="w-full">
//               <div className="w-full border-b-2 border-zinc-300 py-4 flex">
//                 <div className="">
//                   <div className="w-16 shadow-lg rounded-full p-2 mx-2">
//                     <img src={room.icon} alt={''} width={80} height={80} />
//                   </div>
//                 </div>
//                 <div className="flex-grow text-left px-4 py-2 flex flex-col justify-center">
//                   <p className="text-sm mb-1">{room.name}</p>
//                   <p className="text-gray-400 text-sm mt-1">{room.last_message}</p>
//                 </div>
//                 <div className="px-4 py-2 flex flex-col justify-between">
//                   <p className="text-sm mb-1">
//                     {`${('0' + room.last_update.getHours()).slice(-2)}:${(
//                       '0' + room.last_update.getMinutes()
//                     ).slice(-2)}`}
//                   </p>
//                   {room.num_unread != 0 && (
//                     <div className="rounded-full w-8 h-8 bg-green-500" key={room.id}>
//                       <div className="flex flex-col w-full h-full justify-center items-center">
//                         <p className="text-sm text-white text-center">{room.num_unread}</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </button>
//           );
//         })}
//         {/* <textarea className="border-2 w-full" value={message} onChange={handleMessageChange} />
//         <div className="m-8">
//           <button className="text-2xl" onClick={handleSendBtnClick}>
//             送信
//           </button>
//         </div> */}
//       </main>
//     </div>
//   );
// }
