import Header from '../components/header';
import RootLayout from "../pages/layout";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { Query } from 'appwrite';
import { messaging } from "../../../notifications/firebase.js"
import { onMessage } from "firebase/messaging";
import { useToast } from "@/components/ui/use-toast.js";
import bcrypt from "bcryptjs";
import { decryptPassword } from "@/lib/functions/password-manager";
import { Loader2 } from 'lucide-react'

export default function PrivacyPolicy() {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [verified, setVerified] = useState(false);
    const [profile, setProfile] = useState("");
    const [loading, setLoading] = useState(true);

    const handleRedirect = () => {
        Cookies.remove('user_id');
        Cookies.remove('email');
        Cookies.remove('password');
        Cookies.remove('access_token');
    }

    useEffect(() => {
        setLoading(true);
        verifyUser();
        setLoading(false);
      }, [Cookies]);
    
      const verifyUser = async () => {
        if (Cookies.get('user_id') == undefined || Cookies.get('email') == undefined || Cookies.get('password') == undefined) {
          handleRedirect();
        } else {
          try {
            const response = await databases.listDocuments(
              appwriteConfig.databaseID,
              appwriteConfig.userCollectionID,
              [
                Query.equal('$id', Cookies.get('user_id'))
              ]
            );
    
            if (response.documents.length) {
              const password = decryptPassword(Cookies.get('password') || "404");
              bcrypt.compare(password, response.documents[0].password, (err, isMatch) => {
                if (isMatch || password === import.meta.env.VITE_GOOGLE_PASSWORD) {
                  setUsername(response.documents[0].username);
                  setName(response.documents[0].name);
                  setProfile(response.documents[0].profile);
                  setVerified(response.documents[0].verified);
    
                  onMessage(messaging, (payload) => {
                    toast({
                      title: "New Notification!",
                      description: payload.notification.body,
                      duration: 3000,
                    });
                  })
                } else if (err || !isMatch) {
                  handleRedirect();
                }
              });
            } else {
              handleRedirect();
            }
          } catch (error) {
            handleRedirect();
          }
        }
      };
    
      if (loading) {
        return (
          <div className="min-h-screen flex flex-col space-y-4 items-center justify-center">
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        );
      }

    return (
        <RootLayout>
        <div className="min-h-screen bg-background text-foreground">
            <Header activeTab="#" username={username} name={name} profile={profile} verified={verified}/>
            <div className="container pt-4 pb-10">
                <strong>Privacy Policy</strong>
                <p>
                    This privacy policy applies to the Francium app (hereby referred to as
                    "Application") for mobile devices that was created by Codejapoe (hereby
                    referred to as "Service Provider") as an Open Source service. This service
                    is intended for use "AS IS".
                </p>
                <br />
                <strong>Information Collection and Use</strong>
                <p>
                    The Application collects information when you download and use it. This
                    information may include information such as{" "}
                </p>
                <ul>
                    <li>Your device's Internet Protocol address (e.g. IP address)</li>
                    <li>
                    The pages of the Application that you visit, the time and date of your
                    visit, the time spent on those pages
                    </li>
                    <li>The time spent on the Application</li>
                    <li>The operating system you use on your mobile device</li>
                </ul>
                <p />
                <br />
                <p style={{}}>
                    The Application does not gather precise information about the location of
                    your mobile device.
                </p>
                <div style={{ display: "none" }}>
                    <p>
                    The Application collects your device's location, which helps the Service
                    Provider determine your approximate geographical location and make use of
                    in below ways:
                    </p>
                    <ul>
                    <li>
                        Geolocation Services: The Service Provider utilizes location data to
                        provide features such as personalized content, relevant recommendations,
                        and location-based services.
                    </li>
                    <li>
                        Analytics and Improvements: Aggregated and anonymized location data
                        helps the Service Provider to analyze user behavior, identify trends,
                        and improve the overall performance and functionality of the
                        Application.
                    </li>
                    <li>
                        Third-Party Services: Periodically, the Service Provider may transmit
                        anonymized location data to external services. These services assist
                        them in enhancing the Application and optimizing their offerings.
                    </li>
                    </ul>
                </div>
                <br />
                <p>
                    The Service Provider may use the information you provided to contact you
                    from time to time to provide you with important information, required
                    notices and marketing promotions.
                </p>
                <br />
                <p>
                    For a better experience, while using the Application, the Service Provider
                    may require you to provide us with certain personally identifiable
                    information, including but not limited to Name,Email,Birthday,Phone
                    Number,Website,Occupation,Location. The information that the Service
                    Provider request will be retained by them and used as described in this
                    privacy policy.
                </p>
                <br />
                <strong>Third Party Access</strong>
                <p>
                    Only aggregated, anonymized data is periodically transmitted to external
                    services to aid the Service Provider in improving the Application and their
                    service. The Service Provider may share your information with third parties
                    in the ways that are described in this privacy statement.
                </p>
                {/**/}
                <br />
                <p>
                    The Service Provider may disclose User Provided and Automatically Collected
                    Information:
                </p>
                <ul>
                    <li>
                    as required by law, such as to comply with a subpoena, or similar legal
                    process;
                    </li>
                    <li>
                    when they believe in good faith that disclosure is necessary to protect
                    their rights, protect your safety or the safety of others, investigate
                    fraud, or respond to a government request;
                    </li>
                    <li>
                    with their trusted services providers who work on their behalf, do not
                    have an independent use of the information we disclose to them, and have
                    agreed to adhere to the rules set forth in this privacy statement.
                    </li>
                </ul>
                <p />
                <br />
                <strong>Opt-Out Rights</strong>
                <p>
                    You can stop all collection of information by the Application easily by
                    uninstalling it. You may use the standard uninstall processes as may be
                    available as part of your mobile device or via the mobile application
                    marketplace or network.
                </p>
                <br />
                <strong>Data Retention Policy</strong>
                <p>
                    The Service Provider will retain User Provided data for as long as you use
                    the Application and for a reasonable time thereafter. If you'd like them to
                    delete User Provided Data that you have provided via the Application, please
                    contact them at codejapoe@gmail.com and they will respond in a reasonable
                    time.
                </p>
                <br />
                <strong>Children</strong>
                <p>
                    The Service Provider does not use the Application to knowingly solicit data
                    from or market to children under the age of 13.
                </p>
                {/**/}
                <div>
                    <br />
                    <p>
                    The Service Provider does not knowingly collect personally identifiable
                    information from children. The Service Provider encourages all children to
                    never submit any personally identifiable information through the
                    Application and/or Services. The Service Provider encourage parents and
                    legal guardians to monitor their children's Internet usage and to help
                    enforce this Policy by instructing their children never to provide
                    personally identifiable information through the Application and/or
                    Services without their permission. If you have reason to believe that a
                    child has provided personally identifiable information to the Service
                    Provider through the Application and/or Services, please contact the
                    Service Provider (codejapoe@gmail.com) so that they will be able to take
                    the necessary actions. You must also be at least 16 years of age to
                    consent to the processing of your personally identifiable information in
                    your country (in some countries we may allow your parent or guardian to do
                    so on your behalf).
                    </p>
                </div>
                <br />
                <strong>Security</strong>
                <p>
                    The Service Provider is concerned about safeguarding the confidentiality of
                    your information. The Service Provider provides physical, electronic, and
                    procedural safeguards to protect information the Service Provider processes
                    and maintains.
                </p>
                <br />
                <strong>Changes</strong>
                <p>
                    This Privacy Policy may be updated from time to time for any reason. The
                    Service Provider will notify you of any changes to the Privacy Policy by
                    updating this page with the new Privacy Policy. You are advised to consult
                    this Privacy Policy regularly for any changes, as continued use is deemed
                    approval of all changes.
                </p>
                <br />
                <p>This privacy policy is effective as of 2030-12-31</p>
                <br />
                <strong>Your Consent</strong>
                <p>
                    By using the Application, you are consenting to the processing of your
                    information as set forth in this Privacy Policy now and as amended by us.
                </p>
                <br />
                <strong>Contact Us</strong>
                <p>
                    If you have any questions regarding privacy while using the Application, or
                    have questions about the practices, please contact the Service Provider via
                    email at codejapoe@gmail.com.
                </p> 
                <br/>
                <hr/>
            </div>
        </div>
        </RootLayout>
    )
}