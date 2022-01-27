import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import { userState, messagesState } from '../components/atoms';
import { useRecoilState } from 'recoil';
import { domain_db, http_protcol } from '../global';
import { FaUser, FaKey } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';

export default function Home(pageProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleLoginBtnClick = async (e) => {
    const res = await fetch(`${http_protcol}://${domain_db}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    }).catch(() => null);

    if (res != null) {
      const json_data = await res.json().catch(() => null);
      //console.log(json_data);
      if (json_data != null) {
        const token = json_data['token'];
        if (token != null) {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join('')
          );
          const json = JSON.parse(jsonPayload);
          //console.log(json['exp']);
          let dateTime = new Date(json['exp'] * 1000);
          //console.log(dateTime.toString());
          localStorage.setItem('token', token);
          router.push('/user');
        } else {
        }
      }
    } else {
      alert('failed to connect server ' + `${http_protcol}://${domain_db}/login`);
    }
  };

  return (
    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 font-mono flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>Simple Chat sample</title>
        <meta httpEquiv="cache-control" content="no-cache" />
        <meta httpEquiv="expires" content="0" />
        <meta httpEquiv="pragma" content="no-cache" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center container">
        <div className="flex flex-col items-center justify-center px-20 py-20 text-center text-gray-700 border-[1px] border-opacity-30 rounded-md bg-slate-50 bg-opacity-40">
          <div className="flex flex-row justify-start items-center shadow-inner rounded-3xl bg-slate-50 overflow-hidden">
            <div className="w-12 h-12 rounded-full flex flex-row justify-center items-center">
              <div className="flex flex-col justify-center items-center">
                <FaUser size="1.5rem" />
              </div>
            </div>
            <input
              className="ml-4 bg-transparent focus:outline-none"
              value={username}
              placeholder="username"
              onChange={handleUsernameChange}
            />
          </div>
          <div className="m-4"></div>
          <div className="flex flex-row justify-start items-center shadow-inner rounded-3xl bg-slate-50">
            <div className="w-12 h-12 rounded-full flex flex-row justify-center items-center">
              <div className="flex flex-col justify-center items-center">
                <FaKey size="1.5rem" />
              </div>
            </div>
            <input
              className="ml-4 bg-transparent focus:outline-none"
              value={password}
              placeholder="password"
              onChange={handlePasswordChange}
            />
          </div>
          <div className="mt-16 mb-4 w-full">
            <button
              className="text-xl  w-full py-4 text-gray-600 rounded-md bg-white bg-opacity-90 shadow-lg shadow-cyan-700"
              onClick={handleLoginBtnClick}
            >
              Login
            </button>
          </div>
          <hr className="mt-4 border-1 w-full"></hr>
          <div className="mt-8 w-full">
            <Link href="/signup">
              <button
                href="#"
                className="text-sm w-full py-2 text-gray-600 rounded-md bg-white bg-opacity-90 shadow-lg shadow-cyan-700"
              >
                Sigin up
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
