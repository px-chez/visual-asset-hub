import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../context/AuthContext'

const Signin = () => {

const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const {session, signInUser} = UserAuth();
    const navigate = useNavigate();
    console.log(session)

    const handleSignIn = async (e) => {
        e.preventDefault()
        setLoading(true)
        try{
            const result = await signInUser(email, password)

            if(result.success){
                navigate('/main')
            }
        } catch (err) {
            setError("Произошла ошибка.")
        } finally {
            setLoading(false);
        }
    }

  return (
    <div className='position-absolute top-50 start-50 translate-middle'>
        <div className ="input-group mb-3 pb-3">
            <form onSubmit = {handleSignIn} className='d-flex flex-column justify-content-center'>
                <input onChange={(e) => setEmail(e.target.value)}
                    type="text" 
                    className= "form-control mb-3" 
                    placeholder="Email" aria-label="Username" 
                    aria-describedby="basic-addon1" />
                <input onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className= "form-control mb-3"
                    placeholder="Password" aria-label="Username"
                    aria-describedby="basic-addon1" />
                <p>Нет аккаунта?<Link to="/signup">Зерегистрироваться</Link></p>
                <button className='btn btn-dark' type='submit' disabled={loading}>Войти</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    </div>
  )
}

export default Signin
//