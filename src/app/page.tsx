import Image from 'next/image'

import google from './google.svg'
import facebook from './facebook.svg'

export default function Home() {
  return (
    <div className="flex justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="bg-gray-500 rounded-lg py-8 px-4 max-h-max">
        <h1 className="text-xl">Bem vindo ao MyFinan.</h1>
        <h3>Seu gerenciador de finanças descomplicado.</h3>
        <main className="flex flex-col mt-8">
          <label htmlFor="usuario">Nome de usuário</label>
          <input id="usuario" type="text" />

          <label htmlFor="senha" className="mt-4">
            Senha
          </label>
          <input id="senha" type="password" />

          <div className="mt-2">
            <input type="checkbox" name="ok" id="ok" />{' '}
            <label htmlFor="ok">Manter conectado!</label>
          </div>
          <button type="submit" className="mt-8 rounded-lg bg-blue-700 p-3">
            Entrar
          </button>

          <div className="flex justify-between mt-2 text-sm">
            <div>Esqueci minha senha!</div>
            <div>Criar uma conta!</div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <hr className="w-2/5" />
            Ou <hr className="w-2/5" />
          </div>

          <div className="flex flex-col mt-8">
            <div className="flex items-center justify-center gap-4 bg-gray-100 hover:bg-red-600 text-gray-900 hover:text-white font-semibold py-2 px-4 rounded-lg mb-4">
              <Image src={google} width={24} height={24} alt="Logo do Google" />
              Entrar com Google
            </div>

            <div className="flex items-center justify-center gap-4 bg-gray-100 hover:bg-blue-600 text-gray-900 hover:text-white font-semibold py-2 px-4 rounded-lg">
              <Image
                src={facebook}
                width={24}
                height={24}
                alt="Logo do Facebook"
              />
              Entrar com Facebook
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
