import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from '../../context/AuthContext'

const Signup = () => {

const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState('')

    const {session, signUpNewUser} = UserAuth();
    const navigate = useNavigate();
    console.log(session)

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        try{
            const result = await signUpNewUser(email, password)

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
            <form onSubmit = {handleSignUp} className='d-flex flex-column justify-content-center'>
                <input onChange={(e) => setEmail(e.target.value)}
                    type="text" 
                    className= "form-control mb-3" 
                    placeholder="Email" aria-label="Username" 
                    aria-describedby="basic-addon1" />
                <input onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    className= "form-control mb-3"
                    placeholder="Password" aria-label="Password"
                    aria-describedby="basic-addon1" />
                <p>Уже есть аккаунт? <Link to="/signin">Войти</Link></p>
                <button className='btn btn-dark' type='submit' disabled={loading}>Зарегистрироваться</button>
                {error && <p>{error}</p>}
            </form>
        </div>
    </div>
  )
}

export default Signup
//