import React from 'react';
import { useState } from 'react';
import { features_content } from '../content/features-content';
import { Feature } from '../helper-components/feature'
import { CtaButton } from '../helper-components/cta-button';
import { Scrollbars } from 'react-custom-scrollbars';
import DiagramBuild from '../assets/diagram-scaling-build.png';
import DiagramScale from '../assets/diagram-scaling-scale.png';
import ReactCompareImage from 'react-compare-image';

const axios = require('axios').default;


function Landing() {

    const [signUpEmail, setSignUpEmail] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault();
        if (signUpEmail) {
            return axios.post(LPBKND_BASEURL + '/signUps/', {
                email: signUpEmail,
            })
                .catch(function (error) {
                    console.log(error);
                })
                .then(function (response) {
                    setSignUpEmail('')
                })
        }
    }
    return (
        <div id='tailwind'>
            <div className='h-screen'>
                <div className='h-full flex flex-col justify-center'>
                    <div className='grid my-6 p-12 grid-cols-5 h-full overflow-hidden'>


                        <div className='col-span-2'>
                            <div className='h-full flex justify-center items-center'>
                                <div className='col-span-full'>
                                    <div className='p-10 rounded-lg grid gap-6 max-w-md'>
                                        <div className='font-monts text-3xl font-semibold '>
                                            EzBackend
                                        </div>
                                        <div className='font-monts text-md'>
                                            A Node framework focused on speed and ease of use, while keeping the ability to extend and customize
                                        </div>
                                        <div className='font-monts text-lg font-semibold'>
                                            Get 100USD of Hosting Credits when you sign up as an Early Adopter today
                                        </div>
                                        <form>
                                            <input
                                                onChange={e => setSignUpEmail(e.target.value)}
                                                className='border-0 font-monts rounded-lg text-lg p-2 font-semibold w-full'
                                                type="text"
                                                id="submitSignUps"
                                                value={signUpEmail}
                                                placeholder='Email'
                                                name="email" />
                                        </form>
                                        <CtaButton islink={false} onClick={(e) => {
                                            toast.promise(
                                                handleSubmit(e),
                                                {
                                                    loading: 'Submitting...',
                                                    success: <b>Submitted</b>,
                                                    error: <b>Server Error! We are working on it!</b>,
                                                }
                                            );
                                        }}>
                                            Sign Up
                                        </CtaButton>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='col-span-3 w-full p-16'>

                            <Scrollbars autoHide autoHideTimeout={300}>

                                <div className='col-span-full fixed h-24 w-full bg-gradient-to-t from-transparent to-darkness' />

                                <div className='col-span-full h-12 w-full' />

                                <div className='col-span-full py-8 flex justify-center'>
                                    <div className='text-2xl font-mono font-bold'>
                                        Everything You Need
                                    </div>
                                </div>

                                <div className='grid place-items-start gap-6 grid-cols-4'>
                                    {features_content.map((feature) => {
                                        return (
                                            <div className='transform scale-95 transition duration-250 ease-in-out hover:-translate-y-1 hover:scale-110'>
                                                <Feature
                                                    icon={feature.icon}
                                                    title={feature.title}
                                                    info={feature.info}
                                                    route={feature.route}
                                                    released={feature.released}
                                                    hide_cta={true}
                                                    landing={true}
                                                    noClick={true}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className='col-span-full flex justify-center mt-12'>
                                    <ReactCompareImage leftImage={DiagramScale} rightImage={DiagramBuild} sliderPositionPercentage={0.03} sliderLineWidth={4} />
                                </div>

                                <div className='col-span-full h-12 w-full' />

                                <div className='col-span-full fixed bottom-32 h-24 w-full bg-gradient-to-b from-transparent to-darkness' />

                            </Scrollbars>
                        </div>

                    </div>
                </div>
            </div>
        </div>

    );
}

export default Landing;